export type MasterCategory =
  | 'hair'
  | 'nails'
  | 'brows'
  | 'massage'
  | 'cosmetology'
  | 'makeup';

export interface Master {
  id: string;
  name: string;
  category: MasterCategory;
  categoryLabel: string;
  city: string;
  shortDescription: string;
  description: string;
  services: string[];
  contacts: {
    phone: string;
    telegram?: string;
    instagram?: string;
  };
}

export interface MastersQuery {
  category?: string;
  city?: string;
  q?: string;
}
