export type TicketStatus = "available" | "reserved" | "sold";

export interface Raffle {
  id: string;
  title: string;
  description: string | null;
  specs: string | null;
  image_url: string | null;
  icon: string;
  price: number;
  total_tickets: number;
  status: "active" | "finished";
  draw_date: string | null;
  created_at: string;
  winner_number?: number | null;
  winner_display?: string | null;
  draw_video_url?: string | null;
  drawn_at?: string | null;
}

export interface PublicTicket {
  id: number;
  number: number;
  status: TicketStatus;
}

export interface AdminTicket extends PublicTicket {
  raffle_id: string;
  user_id: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  reserved_at: string | null;
  sold_at: string | null;
}

export interface RaffleCount {
  raffle_id: string;
  available: number;
  reserved: number;
  sold: number;
  buyers?: number; // personas distintas con números pagados
}

export interface MyTicket {
  raffle_id: string;
  raffle_title: string;
  raffle_icon: string;
  price: number;
  number: number;
  total_tickets: number;
  status: TicketStatus;
  buyer_name: string | null;
  group_url: string | null;
}

export interface SiteSettings {
  whatsapp_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  terms_text?: string | null;
  terms_updated_at?: string | null;
}

export type ProductCategory = "pollo" | "promos" | "belleza";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  price: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  sort: number;
  created_at: string;
}

export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: string | null;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  order_no: number;
  user_id: string | null;
  buyer_name: string;
  buyer_phone: string;
  address: string | null;
  note: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  order_items: OrderItem[];
}
