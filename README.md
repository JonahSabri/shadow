# املاک شمال — Open API

سایت و API رایگان ملک‌های نوشهر و شمال ایران.  
داده‌ها مستقیماً از یک فایل دیتابیس SQLite محلی خوانده می‌شوند.

---

## ساختار پروژه

```
shadow-site/
├── api/           ← FastAPI backend (خواندن از SQLite + کش)
│   ├── main.py
│   ├── db.sqlite3        ← دیتابیس محلی ملک‌ها (باید جداگانه کپی شود)
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── web/           ← Next.js 16 frontend
│   ├── src/
│   │   ├── app/       ← صفحات
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── .env.local
│   └── Dockerfile
└── docker-compose.yml
```

---

## راه‌اندازی سریع (بدون Docker)

### ۱. FastAPI backend

```bash
cd api
cp .env.example .env
# فایل db.sqlite3 را در همین پوشه قرار دهید
# در صورت نیاز مسیر آن را با DATABASE_PATH در .env تغییر دهید
pip install -r requirements.txt
python main.py
# سرویس روی http://localhost:8001 اجرا می‌شود
# مستندات: http://localhost:8001/docs
```

### ۲. Next.js frontend

```bash
cd web
# ویرایش .env.local در صورت نیاز
npm install --force
npm run dev
# سایت روی http://localhost:3001 اجرا می‌شود
```

---

## راه‌اندازی با Docker

```bash
# کپی و ویرایش env
cp api/.env.example api/.env
# فایل db.sqlite3 را در پوشه api/ قرار دهید

docker-compose up --build -d
```

| سرویس | پورت |
|-------|------|
| FastAPI API | 8001 |
| Next.js Web | 3001 |

---

## API Endpoints

| Method | Path | توضیح |
|--------|------|-------|
| GET | `/properties` | لیست پیج‌بندی‌شده ملک‌ها |
| GET | `/properties/featured` | ملک‌های ویژه/فوری |
| GET | `/properties/{id}` | جزئیات یک ملک |
| GET | `/docs` | مستندات Swagger UI |
| GET | `/redoc` | مستندات ReDoc |
| GET | `/health` | وضعیت سرویس |

### مثال

```bash
# خرید ویلا در نوشهر
curl "http://localhost:8001/properties?city=نوشهر&deal_type=sale&property_type=villa&limit=10"

# جزئیات ملک شماره ۳۰۷
curl "http://localhost:8001/properties/307"
```

---

## تنظیمات `.env` (API)

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `DATABASE_PATH` | `db.sqlite3` | مسیر فایل دیتابیس SQLite محلی |
| `PORT` | `8001` | پورت FastAPI |
| `CACHE_TTL` | `120` | مدت کش به ثانیه |

---

## صفحات وب

| مسیر | توضیح |
|------|-------|
| `/` | لیست و جستجوی ملک‌ها |
| `/property/{id}` | جزئیات ملک |
| `/featured` | ملک‌های ویژه |
| `/docs` | مستندات API اینتراکتیو |
# shadow
