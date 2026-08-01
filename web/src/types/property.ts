export interface PropertyImage {
  id: number;
  image_url: string | null;
  thumbnail_url?: string | null;
  full_image_url?: string | null;
  caption?: string;
  is_primary?: boolean;
  order?: number;
}

export interface PropertyListItem {
  id: number;
  title: string;
  city_name: string;
  neighborhood_name: string;
  address: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  price: number | null;
  price_per_sqm: number | null;
  currency: string;
  deal_type: string;
  deal_type_display: string;
  property_type_key: string;
  property_type_name: string;
  is_featured: boolean;
  is_urgent: boolean;
  is_nowshahr_special_file: boolean;
  sea_view: boolean;
  forest_view: boolean;
  latitude: number | null;
  longitude: number | null;
  primary_image: { image_url: string } | null;
  images_data: PropertyImage[];
  last_updated: string | null;
}

export interface PropertyDetail extends PropertyListItem {
  description: string;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  has_elevator: boolean;
  storage: boolean;
  features: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PropertyListResponse {
  items: PropertyListItem[];
  pagination: Pagination;
}
