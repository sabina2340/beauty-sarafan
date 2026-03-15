export type MasterCard = {
  user_id: number;
  login: string;
  full_name: string;
  description: string;
  short_description?: string;
  services: string;
  short_services?: string;
  phone: string;
  city: string;
  social_links: string;
  avatar_url?: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MasterDetail = MasterCard & {
  work_images?: string[];
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
  created_at?: string;
};

export type ApiError = {
  error: string;
};


export type EquipmentItem = {
  id: number;
  name: string;
  description?: string;
  contact?: string;
  image_url?: string;
  price?: number | null;
};
