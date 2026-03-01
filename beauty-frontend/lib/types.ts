export type MasterCard = {
  user_id: number;
  login: string;
  full_name: string;
  description: string;
  services: string;
  phone: string;
  city: string;
  social_links: string;
  category_id: number;
  category_name: string;
  category_slug: string;
};

export type Advertisement = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  description: string;
  city: string;
  category_id?: number;
  status: string;
  rejection_reason?: string;
};

export type ApiError = {
  error: string;
};
