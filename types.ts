
export interface Product {
  id: string;
  title: string;
  price: number;
  image: string; // Main image
  images: string[]; // Gallery images
  soldOut: boolean;
  handle: string;
  category: string;
  description?: string;
}

export interface Collection {
  id: string;
  title: string;
  image: string;
  handle: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}
