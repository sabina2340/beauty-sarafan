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
  has_active_stories?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MasterDetail = MasterCard & {
  work_images?: {
    id: number;
    media_type: "image" | "video";
    image_url: string;
    video_url: string;
    sort_order: number;
  }[];
};

export type StoryItem = {
  id: number;
  media_type: "image" | "video";
  media_url: string;
  created_at: string;
  expires_at: string;
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


export type ReviewItem = {
  id: number;
  text: string;
  photo_url?: string;
  published_at?: string;
  created_at: string;
  author_name?: string;
};
