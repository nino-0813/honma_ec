import { createClient } from '@supabase/supabase-js';
import { Product } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません。.env.localファイルを確認してください。');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database型定義
export interface DatabaseProduct {
  id: string;
  title: string;
  price: number;
  image: string | null;
  images: string[] | null;
  sold_out: boolean;
  handle: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  has_variants: boolean; // 種類選択の有無
  variants: string[] | null; // 選択肢リスト
  variants_config: any; // 新しいバリエーション設定 (JSONB)
  status: 'active' | 'draft' | 'archived';
  stock: number | null;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database型をProduct型に変換
export const convertDatabaseProductToProduct = (dbProduct: DatabaseProduct): Product => {
  return {
    id: dbProduct.id,
    title: dbProduct.title,
    price: dbProduct.price,
    image: dbProduct.image || '',
    images: dbProduct.images || [],
    soldOut: dbProduct.sold_out,
    handle: dbProduct.handle,
    category: dbProduct.category,
    subcategory: dbProduct.subcategory || undefined,
    description: dbProduct.description || undefined,
    hasVariants: dbProduct.has_variants,
    variants: dbProduct.variants || [],
    variants_config: dbProduct.variants_config || [],
    sku: dbProduct.sku || undefined,
    stock: dbProduct.stock || 0,
  };
};

// Product型をDatabase型に変換
export const convertProductToDatabaseProduct = (product: Partial<Product> & { status?: 'active' | 'draft' | 'archived', is_active?: boolean }) => {
  return {
    title: product.title,
    price: product.price,
    image: product.image || null,
    images: product.images || null,
    sold_out: product.soldOut || false,
    handle: product.handle,
    category: product.category,
    subcategory: product.subcategory || null,
    description: product.description || null,
    has_variants: product.hasVariants || false,
    variants: product.variants || null,
    variants_config: product.variants_config || null,
    status: product.status || 'active',
    stock: product.stock || 0,
    sku: product.sku || null,
    is_active: product.is_active ?? true,
  };
};

// Profile型定義
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
}

// プロフィール情報を取得
export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('プロフィール取得エラー:', error);
    return null;
  }

  return data as Profile;
};

// プロフィール情報を更新
export const updateProfile = async (
  userId: string,
  profileData: Partial<Profile>
): Promise<Profile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      email: profileData.email,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      phone: profileData.phone,
      postal_code: profileData.postal_code,
      address: profileData.address,
      city: profileData.city,
      country: profileData.country || 'JP',
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('プロフィール更新エラー:', error);
    return null;
  }

  return data as Profile;
};

// 注文履歴を取得
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

export const getOrders = async (userId: string): Promise<Order[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        quantity,
        price,
        products:product_id (
          title,
          image,
          images,
          handle
        )
      )
    `)
    .eq('auth_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('注文履歴取得エラー:', error);
    return [];
  }

  // データを整形
  return (data || []).map((order: any) => ({
    id: order.id,
    order_number: order.order_number,
    total_amount: order.total_amount,
    payment_status: order.payment_status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    order_items: (order.order_items || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product: item.products ? {
        title: item.products.title,
        image: item.products.image,
        images: item.products.images,
        handle: item.products.handle,
      } : undefined,
    })),
  }));
};
