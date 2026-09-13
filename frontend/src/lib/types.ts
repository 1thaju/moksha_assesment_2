export interface User {
  id: string;
  email: string;
  name: string;
  picture_url: string | null;
  role: "customer" | "admin";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  stock: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
}

export type OrderStatus = "pending" | "paid" | "payment_failed" | "cancelled";

export interface Order {
  id: string;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  items: OrderItem[];
}
