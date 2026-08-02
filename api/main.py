"""
املاک شمال — Public API Gateway
==============================
API رایگان برای داده‌های ملکی نوشهر و شمال ایران.

این سرویس داده‌ها را مستقیماً از یک دیتابیس محلی SQLite می‌خواند
و با فرمت JSON مستند در اختیار توسعه‌دهندگان قرار می‌دهد.
"""

from __future__ import annotations

import base64
import hashlib
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

import httpx
from cachetools import TTLCache
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from pydantic_settings import BaseSettings

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


# ─── Settings ────────────────────────────────────────────────────────────────

class Settings(BaseSettings):
    database_path: str = str(BASE_DIR / "db.sqlite3")
    port: int = 8001
    api_key: str = ""
    cache_ttl: int = 120
    # دامنه‌ای که فایل‌های تصویر ملک‌ها روی آن ذخیره شده‌اند (در .env تنظیم می‌شود).
    # وقتی مقداردهی شود، تصاویر از طریق اندپوینت /media همین سرویس پروکسی می‌شوند
    # تا هیچ آدرسی از منبع تصاویر در خروجی یا شبکه‌ی مرورگر دیده نشود.
    media_source: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

# ─── Cache ───────────────────────────────────────────────────────────────────

_cache: TTLCache = TTLCache(maxsize=512, ttl=settings.cache_ttl)


def _cache_key(name: str, params: dict) -> str:
    raw = name + str(sorted(params.items()))
    return hashlib.md5(raw.encode()).hexdigest()


# ─── Database ────────────────────────────────────────────────────────────────

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{settings.database_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


PROPERTY_JOIN_SQL = """
    FROM properties_property p
    LEFT JOIN properties_city c ON c.id = p.city_id
    LEFT JOIN properties_neighborhood n ON n.id = p.neighborhood_id
    LEFT JOIN properties_propertytype pt ON pt.id = p.property_type_id
"""

PROPERTY_SELECT_SQL = f"""
    SELECT p.*, c.name AS city_name, n.name AS neighborhood_name, pt.name AS type_key
    {PROPERTY_JOIN_SQL}
"""

ORDERING_MAP = {
    "-created_at": "p.created_at DESC",
    "created_at": "p.created_at ASC",
    "-price": "p.price DESC",
    "price": "p.price ASC",
    "-area": "p.area DESC",
    "area": "p.area ASC",
}

PROPERTY_TYPE_LABELS = {
    "villa": "ویلا",
    "apartment": "آپارتمان",
    "house": "خانه",
    "land": "زمین",
    "shop": "مغازه",
    "office": "اداری",
}
DEAL_TYPE_LABELS = {"sale": "فروش", "rent": "اجاره"}
CURRENCY_LABELS = {"Toman": "تومان", "IRR": "ریال", "Rial": "ریال"}


def _build_filters(params: dict[str, Any]) -> tuple[str, list[Any]]:
    """WHERE clause مشترک بین لیست و جزئیات — فقط ملک‌های فعال.

    توجه: فیلد is_published روی اکثر ملک‌های کامل (با عکس و قیمت) صفر است و
    معیار «فعال بودن» واقعی نیست، برای همین اینجا لحاظ نمی‌شود."""
    clauses = ["p.is_active = 1"]
    args: list[Any] = []

    if params.get("search"):
        like = f"%{params['search']}%"
        clauses.append("(p.title LIKE ? OR p.description LIKE ?)")
        args += [like, like]
    if params.get("city"):
        clauses.append("c.name LIKE ?")
        args.append(f"%{params['city']}%")
    if params.get("neighborhood"):
        clauses.append("n.name LIKE ?")
        args.append(f"%{params['neighborhood']}%")
    if params.get("deal_type"):
        clauses.append("p.deal_type = ?")
        args.append(params["deal_type"])
    if params.get("property_type"):
        clauses.append("pt.name = ?")
        args.append(params["property_type"])
    if params.get("min_price") is not None:
        clauses.append("p.price >= ?")
        args.append(params["min_price"])
    if params.get("max_price") is not None:
        clauses.append("p.price <= ?")
        args.append(params["max_price"])
    if params.get("min_area") is not None:
        clauses.append("p.area >= ?")
        args.append(params["min_area"])
    if params.get("max_area") is not None:
        clauses.append("p.area <= ?")
        args.append(params["max_area"])
    if params.get("bedrooms") is not None:
        clauses.append("p.bedrooms = ?")
        args.append(params["bedrooms"])
    if params.get("sea_view") is not None:
        clauses.append("p.sea_view = ?")
        args.append(1 if params["sea_view"] else 0)
    if params.get("forest_view") is not None:
        clauses.append("p.forest_view = ?")
        args.append(1 if params["forest_view"] else 0)
    if params.get("bbox"):
        try:
            min_lng, min_lat, max_lng, max_lat = (float(x) for x in str(params["bbox"]).split(","))
            clauses.append("p.latitude BETWEEN ? AND ? AND p.longitude BETWEEN ? AND ?")
            args += [min_lat, max_lat, min_lng, max_lng]
        except ValueError:
            pass
    if params.get("extra_where"):
        clauses.append(params["extra_where"])

    return " AND ".join(clauses), args


def _query_properties(
    filters: dict[str, Any], ordering: str, limit: int, offset: int
) -> tuple[list[sqlite3.Row], int]:
    where_sql, args = _build_filters(filters)
    order_sql = ORDERING_MAP.get(ordering, ORDERING_MAP["-created_at"])

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) {PROPERTY_JOIN_SQL} WHERE {where_sql}", args)
        total = cur.fetchone()[0]

        cur.execute(
            f"{PROPERTY_SELECT_SQL} WHERE {where_sql} ORDER BY {order_sql} LIMIT ? OFFSET ?",
            [*args, limit, offset],
        )
        rows = cur.fetchall()
        return rows, total
    finally:
        conn.close()


def _query_all_ids() -> list[sqlite3.Row]:
    """لیست سبک id + تاریخ بروزرسانی همه‌ی ملک‌های فعال — برای sitemap."""
    where_sql, args = _build_filters({})
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT p.id, p.updated_at {PROPERTY_JOIN_SQL} WHERE {where_sql} ORDER BY p.id",
            args,
        )
        return cur.fetchall()
    finally:
        conn.close()


def _fetch_property(property_id: int) -> Optional[sqlite3.Row]:
    where_sql, args = _build_filters({})
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            f"{PROPERTY_SELECT_SQL} WHERE p.id = ? AND {where_sql}",
            [property_id, *args],
        )
        return cur.fetchone()
    finally:
        conn.close()


# ─── Serialization ───────────────────────────────────────────────────────────

def _encode_media_token(url: str) -> str:
    return base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")


def _decode_media_token(token: str) -> str:
    padded = token + "=" * (-len(token) % 4)
    return base64.urlsafe_b64decode(padded.encode()).decode()


def _proxy_image_url(url: Optional[str]) -> Optional[str]:
    """آدرس تصویر را به اندپوینت داخلی /media تبدیل می‌کند تا دامنه‌ی منبع اصلی
    هیچ‌وقت مستقیماً در پاسخ API یا شبکه‌ی مرورگر ظاهر نشود."""
    if not url or not settings.media_source:
        return url
    if url.startswith(settings.media_source):
        return f"/media/{_encode_media_token(url)}"
    return url


def _parse_json_list(raw: Optional[str]) -> list:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except (TypeError, ValueError):
        return []
    return data if isinstance(data, list) else []


def _build_images_data(raw_images: Optional[str]) -> list[dict]:
    images = _parse_json_list(raw_images)
    result = []
    for i, img in enumerate(images):
        if not isinstance(img, dict):
            continue
        url = img.get("full_url") or img.get("url")
        if not url:
            continue
        result.append(
            {
                "id": i + 1,
                "image_url": _proxy_image_url(url),
                "thumbnail_url": _proxy_image_url(img.get("thumbnail_url")),
                "full_image_url": _proxy_image_url(url),
                "caption": img.get("caption") or "",
                "is_primary": bool(img.get("is_primary")),
                "order": i,
            }
        )
    return result


def _primary_image(images_data: list[dict]) -> Optional[dict]:
    for img in images_data:
        if img["is_primary"]:
            return {"image_url": img["image_url"]}
    return {"image_url": images_data[0]["image_url"]} if images_data else None


def _row_to_list_item(row: sqlite3.Row) -> dict:
    images_data = _build_images_data(row["images"])
    type_key = row["type_key"] or ""
    currency = row["currency"] or "Toman"
    return {
        "id": row["id"],
        "title": row["title"],
        "city_name": row["city_name"] or "",
        "neighborhood_name": row["neighborhood_name"] or "",
        "address": row["address"] or "",
        "area": row["area"],
        "bedrooms": row["bedrooms"],
        "bathrooms": row["bathrooms"],
        "parking_spaces": row["parking_spaces"],
        "price": row["price"],
        "price_per_sqm": row["price_per_sqm"],
        "currency": CURRENCY_LABELS.get(currency, currency),
        "deal_type": row["deal_type"],
        "deal_type_display": DEAL_TYPE_LABELS.get(row["deal_type"], row["deal_type"]),
        "property_type_key": type_key,
        "property_type_name": PROPERTY_TYPE_LABELS.get(type_key, type_key),
        "is_featured": bool(row["is_featured"]),
        "is_urgent": bool(row["is_urgent"]),
        "is_nowshahr_special_file": bool(row["is_nowshahr_special_file"]),
        "sea_view": bool(row["sea_view"]),
        "forest_view": bool(row["forest_view"]),
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "primary_image": _primary_image(images_data),
        "images_data": images_data,
        "last_updated": row["updated_at"],
    }


def _row_to_detail(row: sqlite3.Row) -> dict:
    item = _row_to_list_item(row)
    item.update(
        {
            "description": row["description"] or "",
            "floor": row["floor"],
            "total_floors": row["total_floors"],
            "year_built": row["year_built"],
            "has_elevator": bool(row["has_elevator"]),
            "storage": bool(row["storage"]),
            "features": _parse_json_list(row["features"]),
        }
    )
    return item


def _normalize_list(rows: list[sqlite3.Row], total: int, page: int, limit: int) -> dict:
    return {
        "items": [_row_to_list_item(r) for r in rows],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": max(1, -(-total // limit)),  # ceiling division
        },
    }


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="املاک شمال API",
    description=(
        "API رایگان داده‌های ملکی نوشهر و شمال ایران.\n\n"
        "تمامی ملک‌ها، فیلترها، صفحه‌بندی و جزئیات از طریق این API قابل دسترسی هستند."
    ),
    version="1.0.0",
    contact={"name": "املاک شمال"},
    license_info={"name": "Free for non-commercial use"},
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ─── Schemas ─────────────────────────────────────────────────────────────────

class ApiInfo(BaseModel):
    name: str
    version: str
    description: str
    endpoints: list[str]


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/", response_model=ApiInfo, tags=["Info"])
async def root():
    """اطلاعات کلی API."""
    return {
        "name": "املاک شمال API",
        "version": "1.0.0",
        "description": "API رایگان ملک‌های نوشهر و شمال ایران",
        "endpoints": [
            "GET /properties          — لیست ملک‌ها",
            "GET /properties/{id}     — جزئیات یک ملک",
            "GET /properties/featured — ملک‌های ویژه",
            "GET /docs                — مستندات Swagger",
            "GET /redoc               — مستندات ReDoc",
        ],
    }


@app.get(
    "/properties",
    summary="لیست ملک‌ها",
    description=(
        "لیست پیج‌بندی‌شده ملک‌های فعال. "
        "از پارامترهای جستجو برای فیلتر کردن استفاده کنید."
    ),
    tags=["Properties"],
)
def list_properties(
    page: int = Query(1, ge=1, description="شماره صفحه"),
    limit: int = Query(18, ge=1, le=50, description="تعداد در هر صفحه (حداکثر ۵۰)"),
    search: Optional[str] = Query(None, description="جستجو در عنوان و توضیحات"),
    city: Optional[str] = Query(None, description="نام شهر — مثلاً نوشهر، چالوس، نور"),
    neighborhood: Optional[str] = Query(None, description="نام محله"),
    deal_type: Optional[str] = Query(None, description="نوع معامله: sale | rent"),
    property_type: Optional[str] = Query(
        None,
        description="نوع ملک: villa | apartment | land | house | shop | office",
    ),
    min_price: Optional[int] = Query(None, ge=0, description="حداقل قیمت (تومان)"),
    max_price: Optional[int] = Query(None, ge=0, description="حداکثر قیمت (تومان)"),
    min_area: Optional[int] = Query(None, ge=0, description="حداقل متراژ (متر مربع)"),
    max_area: Optional[int] = Query(None, ge=0, description="حداکثر متراژ (متر مربع)"),
    bedrooms: Optional[int] = Query(None, ge=0, description="تعداد اتاق خواب"),
    sea_view: Optional[bool] = Query(None, description="ویو دریا"),
    forest_view: Optional[bool] = Query(None, description="ویو جنگل"),
    bbox: Optional[str] = Query(
        None,
        description="محدوده نقشه: min_lng,min_lat,max_lng,max_lat",
    ),
    ordering: Optional[str] = Query(
        "-created_at",
        description="ترتیب: -created_at | -price | price | -area | area",
    ),
):
    filters = {
        "search": search,
        "city": city,
        "neighborhood": neighborhood,
        "deal_type": deal_type,
        "property_type": property_type,
        "min_price": min_price,
        "max_price": max_price,
        "min_area": min_area,
        "max_area": max_area,
        "bedrooms": bedrooms,
        "sea_view": sea_view,
        "forest_view": forest_view,
        "bbox": bbox,
    }
    key = _cache_key("list", {**filters, "page": page, "limit": limit, "ordering": ordering})
    if key in _cache:
        return _cache[key]

    offset = (page - 1) * limit
    rows, total = _query_properties(filters, ordering or "-created_at", limit, offset)
    result = _normalize_list(rows, total, page, limit)

    _cache[key] = result
    return result


@app.get(
    "/properties/featured",
    summary="ملک‌های ویژه و فوری",
    description="لیست ملک‌هایی که is_featured یا is_urgent هستند.",
    tags=["Properties"],
)
def featured_properties(
    limit: int = Query(12, ge=1, le=50, description="تعداد ملک‌های ویژه"),
):
    key = _cache_key("featured", {"limit": limit})
    if key in _cache:
        return _cache[key]

    filters = {"extra_where": "(p.is_featured = 1 OR p.is_urgent = 1)"}
    rows, total = _query_properties(filters, "-created_at", limit, 0)
    result = _normalize_list(rows, total, 1, limit)

    _cache[key] = result
    return result


@app.get(
    "/properties/sitemap-ids",
    summary="لیست سبک شناسه‌ها — برای ساخت sitemap",
    tags=["Properties"],
)
def properties_sitemap_ids():
    key = "sitemap-ids"
    if key in _cache:
        return _cache[key]
    rows = _query_all_ids()
    result = {"items": [{"id": r["id"], "updated_at": r["updated_at"]} for r in rows]}
    _cache[key] = result
    return result


@app.get(
    "/properties/{property_id}",
    summary="جزئیات یک ملک",
    tags=["Properties"],
)
def property_detail(property_id: int):
    """اطلاعات کامل یک ملک بر اساس شناسه."""
    key = _cache_key("detail", {"id": property_id})
    if key in _cache:
        return _cache[key]

    row = _fetch_property(property_id)
    if row is None:
        raise HTTPException(status_code=404, detail="ملک یافت نشد")

    result = _row_to_detail(row)
    _cache[key] = result
    return result


@app.get("/media/{token}", include_in_schema=False)
async def media_proxy(token: str):
    """پروکسی تصاویر ملک: فایل را از منبع اصلی می‌گیرد و بدون افشای آدرس آن
    مستقیماً به مرورگر تحویل می‌دهد."""
    try:
        original_url = _decode_media_token(token)
    except Exception:
        raise HTTPException(status_code=404, detail="یافت نشد")

    if not settings.media_source or not original_url.startswith(settings.media_source):
        raise HTTPException(status_code=404, detail="یافت نشد")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(original_url)
            resp.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="دریافت تصویر ناموفق بود")

    return Response(
        content=resp.content,
        media_type=resp.headers.get("content-type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=604800, immutable"},
    )


@app.get("/health", include_in_schema=False)
def health():
    try:
        conn = get_conn()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except sqlite3.Error:
        db_ok = False
    return {"status": "ok" if db_ok else "degraded", "database": db_ok, "ts": int(time.time())}


# ─── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
