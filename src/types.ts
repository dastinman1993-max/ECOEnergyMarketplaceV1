/**
 * Types and interfaces for EcoMessenger Marketplace.
 */

export interface CatalogItem {
  id: string;
  wallet_address: string;
  name: string;
  description: string;
  price_uah: number;
  image_url: string | null;
  category_id: string;
  subcategory_id: string;
  region_id: string;
  district_id: string;
  address_detail: string | null;
  allow_group_order: boolean;
  active: boolean;
  created_at: string;
  refreshed_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_uk: string;
  sort_order: number;
}

export interface Subcategory {
  id: string;
  category_id: string;
  slug: string;
  name_uk: string;
  sort_order: number;
}

export interface Region {
  id: string;
  slug: string;
  name_uk: string;
  sort_order: number;
}

export interface District {
  id: string;
  region_id: string;
  slug: string;
  name_uk: string;
  sort_order: number;
}

export interface TelegramLink {
  wallet_address: string;
  telegram_id: number;
  telegram_username: string | null;
}

export interface Ad {
  advertiser: string;
  text: string;
  authorNickname: string;
  placedAt: bigint;
  occupied: boolean;
}

export interface CartItem {
  item: CatalogItem;
  quantity: number;
}

export interface OrderSubmission {
  buyer: {
    telegram_id: number;
    telegram_username: string | null;
    name: string;
    phone: string;
  };
  seller_telegram_id: number;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price_uah: number;
    total_uah: number;
  }[];
  delivery: {
    method: string;
    address: string;
  };
  comment: string;
  total_uah: number;
}
