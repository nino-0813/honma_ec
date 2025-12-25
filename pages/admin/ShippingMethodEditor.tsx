import React, { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { supabase } from '../../lib/supabase';
import { IconArrowLeft, IconLoader2, IconCheck } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';
import { ShippingMethod, AreaFees, Product } from '../../types';

const AREA_LABELS: Record<keyof AreaFees, string> = {
  hokkaido: '北海道',
  tohoku: '東北',
  kanto: '関東',
  chubu: '中部',
  kansai: '関西',
  chugoku: '中国',
  shikoku: '四国',
  kyushu: '九州',
  okinawa: '沖縄',
};

const AREA_KEYS: (keyof AreaFees)[] = [
  'hokkaido',
  'tohoku',
  'kanto',
  'chubu',
  'kansai',
  'chugoku',
  'shikoku',
  'kyushu',
  'okinawa',
];

const ShippingMethodEditor = () => {
  const [match, params] = useRoute<{ id?: string }>('/admin/shipping-methods/:id?');
  const methodId = params?.id;
  const isNew = !methodId || methodId === 'new';
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // フォーム状態
  const [name, setName] = useState('');
  const [boxSize, setBoxSize] = useState<number | ''>('');
  const [maxWeightKg, setMaxWeightKg] = useState<number | ''>('');
  const [maxItemsPerBox, setMaxItemsPerBox] = useState<number | ''>('');
  const [feeType, setFeeType] = useState<'uniform' | 'area'>('uniform');
  const [uniformFee, setUniformFee] = useState<number | ''>('');
  const [areaFees, setAreaFees] = useState<AreaFees>({});

  // 商品選択
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (!isNew && methodId) {
      fetchShippingMethod(methodId);
    }
    fetchProducts();
  }, [methodId, isNew]);

  const fetchShippingMethod = async (id: string) => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || '');
        setBoxSize(data.box_size || '');
        setMaxWeightKg(data.max_weight_kg || '');
        setMaxItemsPerBox(data.max_items_per_box || '');
        setFeeType(data.fee_type || 'uniform');
        setAreaFees((data.area_fees || {}) as AreaFees);
        setUniformFee(data.uniform_fee || '');

        // 紐づいている商品を取得
        const { data: linkedProducts, error: linkError } = await supabase
          .from('product_shipping_methods')
          .select('product_id')
          .eq('shipping_method_id', id);

        if (!linkError && linkedProducts) {
          setSelectedProductIds(linkedProducts.map((p: any) => p.product_id));
        }
      }
    } catch (error) {
      console.error('発送方法の取得エラー:', error);
      alert('発送方法の取得に失敗しました');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, title, sku, price')
        .order('title', { ascending: true });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('商品の取得エラー:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAreaFeeChange = (area: keyof AreaFees, value: string) => {
    setAreaFees((prev) => ({
      ...prev,
      [area]: value === '' ? undefined : Number(value),
    }));
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const methodData: any = {
        name,
        box_size: boxSize === '' ? null : Number(boxSize),
        max_weight_kg: maxWeightKg === '' ? null : Number(maxWeightKg),
        max_items_per_box: maxItemsPerBox === '' ? null : Number(maxItemsPerBox),
        fee_type: feeType,
        area_fees: feeType === 'area' ? areaFees : {},
        uniform_fee: feeType === 'uniform' && uniformFee !== '' ? Number(uniformFee) : null,
      };

      let savedMethodId = methodId;

      if (isNew) {
        const { data, error } = await supabase
          .from('shipping_methods')
          .insert(methodData)
          .select()
          .single();

        if (error) throw error;
        savedMethodId = data.id;
      } else {
        const { error } = await supabase
          .from('shipping_methods')
          .update(methodData)
          .eq('id', methodId);

        if (error) throw error;
      }

      // 商品との紐づけを更新
      if (savedMethodId) {
        // 既存の紐づけを削除
        await supabase
          .from('product_shipping_methods')
          .delete()
          .eq('shipping_method_id', savedMethodId);

        // 新しい紐づけを追加
        if (selectedProductIds.length > 0) {
          const links = selectedProductIds.map((productId) => ({
            product_id: productId,
            shipping_method_id: savedMethodId,
          }));

          const { error: linkError } = await supabase
            .from('product_shipping_methods')
            .insert(links);

          if (linkError) throw linkError;
        }
      }

      alert(isNew ? '発送方法を作成しました' : '発送方法を更新しました');
      setLocation('/admin/shipping-methods');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/admin/shipping-methods">
          <a className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <IconArrowLeft className="w-4 h-4" />
            発送方法管理に戻る
          </a>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? '新規発送方法を作成' : '発送方法を編集'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                発送方法名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                placeholder="例：米用ダンボールM"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ダンボールサイズ
                </label>
                <select
                  value={boxSize}
                  onChange={(e) => setBoxSize(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                >
                  <option value="">選択してください</option>
                  <option value="60">60サイズ</option>
                  <option value="80">80サイズ</option>
                  <option value="100">100サイズ</option>
                  <option value="120">120サイズ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大重量 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={maxWeightKg}
                  onChange={(e) => setMaxWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="例：10.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  1箱に入る最大商品数
                </label>
                <input
                  type="number"
                  value={maxItemsPerBox}
                  onChange={(e) => setMaxItemsPerBox(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="例：5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 送料設定 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">送料設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                送料タイプ <span className="text-red-500">*</span>
              </label>
              <select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value as 'uniform' | 'area')}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                <option value="uniform">全国一律</option>
                <option value="area">地域別</option>
              </select>
            </div>

            {feeType === 'uniform' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  送料（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={uniformFee}
                  onChange={(e) => setUniformFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="例：800"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地域別送料（円）
                </label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">地域</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">送料</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {AREA_KEYS.map((area) => (
                        <tr key={area}>
                          <td className="px-4 py-2 text-sm text-gray-900">{AREA_LABELS[area]}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={areaFees[area] || ''}
                              onChange={(e) => handleAreaFeeChange(area, e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm text-right bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 商品選択 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            この発送方法を使う商品を選択
          </h2>
          {productsLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProductIds.length === products.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(products.map((p) => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 bg-white text-black focus:ring-black focus:ring-2"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">商品名</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">価格</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedProductIds.includes(product.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleProductToggle(product.id)}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          className="w-4 h-4 rounded border-gray-300 bg-white text-black focus:ring-black focus:ring-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{product.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{product.sku || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                        ¥{product.price?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="text-center py-8 text-gray-500">商品が登録されていません</div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            選択した商品にこの発送方法が適用されます
          </p>
        </div>

        {/* 保存ボタン */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/shipping-methods">
            <a className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              キャンセル
            </a>
          </Link>
          <LoadingButton
            type="submit"
            loading={saving}
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isNew ? '作成' : '更新'}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};

export default ShippingMethodEditor;

