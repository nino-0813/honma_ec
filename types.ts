
export interface Product {
  id: string;
  title: string;
  price: number;
  image: string; // Main image
  images: string[]; // Gallery images
  soldOut: boolean;
  handle: string;
  category: string;
  subcategory?: string; // サブカテゴリー (koshihikari, kamenoo, nikomaru, yearly など)
  description?: string;
  hasVariants?: boolean; // 種類選択を表示するかどうか
  variants?: string[]; // 選択肢のリスト
}

export interface Collection {
  id: string;
  title: string;
  image: string;
  handle: string;
  path?: string;
  backgroundImage?: string; // 水彩背景画像
  bagImage?: string; // 米袋画像
  description?: string[]; // 説明文の配列
  subtitle?: string; // サブタイトル
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string; // 選択された種類
}
