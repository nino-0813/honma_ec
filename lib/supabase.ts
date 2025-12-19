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
  display_order: number | null;
  is_visible: boolean | null;
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
    display_order: dbProduct.display_order ?? undefined,
    is_visible: dbProduct.is_visible ?? true,
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
    display_order: product.display_order ?? null,
    is_visible: product.is_visible ?? true,
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

// 在庫チェック用のユーティリティ関数
/**
 * 選択されたバリエーションから在庫数を取得
 * @param product 商品情報
 * @param selectedOptions 選択されたバリエーションオプション（Type ID -> Option ID）
 * @returns 在庫数（nullの場合は無制限）
 */
export const getStockForVariant = (product: Product, selectedOptions: Record<string, string>): number | null => {
  // バリエーションがない場合
  if (!product.hasVariants) {
    return product.stock ?? null;
  }

  // 新しいvariants_configがある場合
  if (product.variants_config && product.variants_config.length > 0) {
    let minStock: number | null = null;
    const baseStock = product.stock ?? null;

    // 各バリエーションタイプを確認し、在庫の最小値を採用
    for (const type of product.variants_config) {
      const selectedOptionId = selectedOptions[type.id];
      if (!selectedOptionId) continue;

      const option = type.options.find(o => o.id === selectedOptionId);
      if (!option) continue;

      if (type.stockManagement === 'none') {
        // 在庫管理しない場合はスキップ
        continue;
      } else if (type.stockManagement === 'individual') {
        // 在庫共有が有効な場合
        if (type.sharedStock !== null && type.sharedStock !== undefined) {
          const sharedStockValue = Number(type.sharedStock);
          minStock = minStock === null ? sharedStockValue : Math.min(minStock, sharedStockValue);
        } else {
          // 個別在庫の場合: 数値が設定されていれば候補に含める（0も有効な在庫）
          if (option.stock !== null && option.stock !== undefined) {
            const stockValue = Number(option.stock);
            minStock = minStock === null ? stockValue : Math.min(minStock, stockValue);
          }
          // null/undefined は在庫管理しないオプションとして無視
        }
      } else if (type.stockManagement === 'shared') {
        // 基本在庫を共有する場合（互換性のため残しているが、基本在庫は使用しない）
        // 基本在庫を使用しないため、在庫チェックをスキップ（nullを返す）
        continue;
      }
    }

    // いずれかで在庫が決まった場合はその最小値、決まらない場合は基本在庫
    return minStock !== null ? minStock : baseStock;
  }

  // 旧形式のvariantsがある場合（基本在庫を使用）
  return product.stock ?? null;
};

/**
 * 在庫チェック
 * @param product 商品情報
 * @param selectedOptions 選択されたバリエーションオプション
 * @param requestedQuantity 追加したい数量
 * @param currentCartQuantity カート内の既存数量（同じ商品・バリエーション）
 * @returns { available: boolean, availableStock: number | null, message: string }
 */
export const checkStockAvailability = (
  product: Product,
  selectedOptions: Record<string, string>,
  requestedQuantity: number,
  currentCartQuantity: number = 0
): { available: boolean; availableStock: number | null; message: string } => {
  const stock = getStockForVariant(product, selectedOptions);

  // 在庫がnullの場合は無制限として扱う
  if (stock === null) {
    return {
      available: true,
      availableStock: null,
      message: ''
    };
  }

  const totalQuantity = currentCartQuantity + requestedQuantity;

  if (totalQuantity > stock) {
    const availableQuantity = Math.max(0, stock - currentCartQuantity);
    return {
      available: false,
      availableStock: stock,
      message: availableQuantity > 0
        ? `在庫が不足しています。追加可能な数量は${availableQuantity}個です。`
        : '在庫が不足しています。'
    };
  }

  return {
    available: true,
    availableStock: stock,
    message: ''
  };
};
