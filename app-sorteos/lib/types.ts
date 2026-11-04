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
