
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'removed' | 'disputed';
export type ListingCondition = 'new' | 'used' | 'refurbished';
export type TransactionStatus =
  | 'pending' | 'paid' | 'confirmed' | 'disputed' | 'completed' | 'refunded' | 'cancelled';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface User {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  rating: number;
  total_sales: number;
  total_purchases: number;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;   
  order_index: number;
  is_primary: boolean;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  icon: string | null;
  is_active: boolean;
  children?: Category[];
}

export interface Listing {
  id: string;
  seller_id: string;
  category_id: number | null;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: ListingStatus;
  condition: ListingCondition | null;
  location: string | null;
  views_count: number;
  created_at: string;
  images: ListingImage[];
  seller: Pick<User, 'id' | 'wallet_address' | 'username' | 'display_name' | 'avatar_url' | 'rating'>;
  category: Category | null;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  escrow_contract_address: string | null;
  tx_hash: string | null;
  status: TransactionStatus;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  dispute_reason: string | null;
  dispute_opened_at: string | null;
  listing: Listing;
  buyer: Pick<User, 'id' | 'wallet_address' | 'username' | 'display_name' | 'avatar_url'>;
  seller: Pick<User, 'id' | 'wallet_address' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Chat {
  listing: Listing;
  lastMessage: Message;
}

export interface Review {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface EmailNotification {
  id: string;
  subject: string;
  template: string;
  status: NotificationStatus;
  attempts: number;
  sent_at: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlockchainHealth {
  status: 'ok' | 'error';
  network: string;
  connected: boolean;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  walletAddress: string;
  username: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ListingSearchParams {
  query?: string;
  category_id?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition;
  location?: string;
  sortBy?: 'created_at' | 'price' | 'views_count';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}
