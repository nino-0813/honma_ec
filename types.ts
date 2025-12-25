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
  variants?: string[]; // 選択肢のリスト（旧仕様）
  variants_config?: { // 新仕様
    id: string;
    name: string;
    options: {
      id: string;
      value: string;
      priceAdjustment: number;
      stock: number | null;
    }[];
    stockManagement: 'shared' | 'individual' | 'none';
    sharedStock?: number | null; // 在庫共有時の共有在庫数
  }[];
  sku?: string;
  stock?: number;
  display_order?: number; // 表示順序
  is_visible?: boolean; // 表示/非表示
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
  finalPrice?: number; // バリエーション価格調整後の最終価格（カート追加時に固定）
  selectedOptions?: Record<string, string>; // 選択したオプション（在庫チェック用）
}

export interface Review {
  id: string;
  name: string;
  type?: string; // 注文タイプ（3回目の注文など）
  date: string;
  rating: number;
  comment: string;
  productName: string;
  image?: string;
  is_verified?: boolean; // 購入者かどうか
}

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message?: string;
}

export interface Customer {
  id: string; // profile_id or order_id based logic
  name: string;
  email: string;
  phone?: string;
  orders_count: number;
  total_spent: number;
  last_order_date?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface Order {
  id: string;
  order_number: string | null;
  total_amount: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    title: string;
    image: string | null;
    images: string[] | null;
    handle: string;
  };
}

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  postal_code: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

// 発送方法の地域別送料
export interface AreaFees {
  hokkaido?: number;    // 北海道
  tohoku?: number;       // 東北
  kanto?: number;        // 関東
  chubu?: number;       // 中部
  kansai?: number;      // 関西
  chugoku?: number;     // 中国
  shikoku?: number;     // 四国
  kyushu?: number;      // 九州
  okinawa?: number;     // 沖縄
}

// 発送方法
export interface ShippingMethod {
  id: string;
  name: string;                    // 発送方法名（例：米用ダンボールM）
  box_size: number | null;         // ダンボールサイズ（60 / 80 / 100 / 120）
  max_weight_kg: number | null;   // 最大重量（kg）
  max_items_per_box: number | null; // 1箱に入る最大商品数（発送量）
  fee_type: 'uniform' | 'area';   // 送料タイプ（全国一律 / 地域別）
  area_fees: AreaFees;            // 地域別送料（JSON形式）
  uniform_fee?: number;           // 全国一律送料（fee_typeが'uniform'の場合）
  created_at: string;
  updated_at: string;
}

// 商品と発送方法の紐づけ
export interface ProductShippingMethod {
  id: string;
  product_id: string;
  shipping_method_id: string;
  created_at: string;
}
