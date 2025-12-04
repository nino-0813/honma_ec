# IKEVEGE - ECサイト & 管理画面

新潟県佐渡産の自然栽培米を販売するECサイトと管理画面システム

## 📋 プロジェクト概要

このプロジェクトは、Vite + React + TypeScriptで構築されたECサイトと管理画面です。現在は静的データを使用していますが、Supabase連動により完全なバックエンド機能を実装予定です。

## 🚀 ローカル実行方法

### 前提条件
- Node.js 18以上

### セットアップ

1. 依存関係のインストール:
   ```bash
   npm install
   ```

2. 開発サーバーの起動:
   ```bash
   npm run dev
   ```

3. ブラウザでアクセス:
   - フロントエンド: `http://localhost:3009`
   - 管理画面: `http://localhost:3009/#/admin`

## 📁 プロジェクト構成

```
ikevege-(イケベジ)/
├── components/          # 共通コンポーネント
│   ├── Header.tsx      # ヘッダー（ナビゲーション、カート）
│   ├── Footer.tsx      # フッター
│   ├── HeroVideo.tsx   # ヒーロー動画セクション
│   ├── Collections.tsx # コレクション表示
│   ├── ParallaxSection.tsx # パララックス背景セクション
│   ├── ProductGrid.tsx # 商品グリッド
│   ├── ContactSection.tsx # お問い合わせセクション
│   ├── Drawers.tsx     # カート・メニュードロワー
│   ├── UI.tsx          # UIコンポーネント（FadeInImage, LoadingButton）
│   └── Icons.tsx        # アイコンコンポーネント（Lucide React）
│
├── pages/              # ページコンポーネント
│   ├── Home.tsx        # ホームページ
│   ├── About.tsx       # 会社概要ページ
│   ├── Category.tsx    # 商品カテゴリーページ
│   ├── ProductDetail.tsx # 商品詳細ページ
│   ├── Ambassador.tsx  # アンバサダーページ
│   ├── ContactPage.tsx # お問い合わせページ
│   └── admin/          # 管理画面ページ
│       ├── AdminLayout.tsx    # 管理画面レイアウト
│       ├── Dashboard.tsx       # ダッシュボード
│       ├── ProductList.tsx     # 商品一覧
│       ├── ProductEditor.tsx   # 商品編集
│       ├── Orders.tsx          # 注文管理
│       ├── Customers.tsx       # 顧客管理
│       ├── Discounts.tsx       # ディスカウント管理
│       ├── Content.tsx         # コンテンツ管理
│       ├── Market.tsx          # マーケット管理
│       ├── Finance.tsx         # 財務管理
│       └── Analytics.tsx       # ストア分析
│
├── data/               # データファイル
│   └── products.ts     # 商品データ（19商品）
│
├── types.ts            # TypeScript型定義
├── App.tsx             # メインアプリケーション（ルーティング）
└── public/             # 静的ファイル
    └── images/         # 画像ファイル
        ├── home/       # ホームページ画像
        ├── about/      # Aboutページ画像
        ├── products/   # 商品画像
        └── admin/      # 管理画面画像
```

## ✨ 実装済み機能

### フロントエンド（ECサイト）

#### ページ
- ✅ **ホームページ** (`/`)
  - YouTube動画ヒーローセクション
  - コレクション表示（コシヒカリ、亀の尾、にこまる、年間契約）
  - パララックス背景セクション
  - 商品グリッド（最大8商品表示）
  - お問い合わせセクション

- ✅ **Aboutページ** (`/about`)
  - ヒーロー画像（IMG_9172.jpg）
  - 哲学セクション（Farm to Social）
  - OUR 3 STANCES タイトル
  - ビジュアルストーリーテリング（2つのストーリー）
  - 会社プロフィール

- ✅ **商品カテゴリーページ** (`/collections`)
  - カテゴリーフィルター（ALL、お米、年間契約、Crescentmoon、その他）
  - 価格ソート機能
  - 商品グリッド表示（19商品）
  - レスポンシブ対応

- ✅ **商品詳細ページ** (`/products/:handle`)
  - 商品画像ギャラリー
  - 価格・説明表示
  - 数量選択
  - カート追加機能
  - アコーディオン形式の詳細情報

- ✅ **アンバサダーページ** (`/ambassador`)
  - アンバサダー募集セクション

- ✅ **お問い合わせページ** (`/contact`)
  - お問い合わせフォーム

#### 共通機能
- ✅ ヘッダー（ナビゲーション、検索、カート、メニュー）
- ✅ フッター（SNSリンク、会社情報）
- ✅ カートドロワー
- ✅ モバイルメニュードロワー
- ✅ スクロールアニメーション
- ✅ 画像の遅延読み込み（FadeInImage）

### 管理画面

#### ページ
- ✅ **ダッシュボード** (`/admin`)
  - 期間・チャネルフィルター
  - KPIカード（セッション数、販売合計、注文、コンバージョン率）
  - ストアステータス
  - 商品プレビュー
  - ストアプレビュー
  - 決済ステータス
  - ドメインカスタマイズ

- ✅ **商品管理** (`/admin/products`)
  - 商品一覧テーブル
  - 検索・フィルター機能
  - 商品追加・編集リンク
  - ステータス表示（販売中/在庫なし）
  - ページネーション

- ✅ **商品編集** (`/admin/products/:handle`, `/admin/products/new`)
  - 商品情報フォーム（タイトル、説明、価格、カテゴリー、ハンドル）
  - 画像アップロード機能
  - 商品ステータス管理（販売中/下書き/アーカイブ）
  - 在庫切れフラグ

- ✅ **注文管理** (`/admin/orders`)
  - 注文一覧テーブル
  - ステータス別統計カード
  - 検索・フィルター機能
  - 注文ステータス管理

- ✅ **顧客管理** (`/admin/customers`)
  - 顧客一覧テーブル
  - 総顧客数、アクティブ顧客、総売上統計
  - 顧客詳細表示

- ✅ **ディスカウント管理** (`/admin/discounts`)
  - 割引コード一覧
  - 割引タイプ（% / 固定額）管理
  - 使用回数・制限管理
  - 期間管理

- ✅ **コンテンツ管理** (`/admin/content`)
  - ページ・ブログ・お知らせ管理
  - 公開ステータス管理
  - 閲覧数統計

- ✅ **マーケット管理** (`/admin/market`)
  - 販売チャネル管理
  - チャネル別売上表示

- ✅ **財務管理** (`/admin/finance`)
  - 取引履歴
  - 総売上、手数料、純利益統計
  - 期間別フィルター

- ✅ **ストア分析** (`/admin/analytics`)
  - 主要指標（セッション、訪問者、注文、コンバージョン率など）
  - 人気商品トップ3
  - グラフ表示エリア

#### 共通機能
- ✅ サイドバーナビゲーション
- ✅ レスポンシブ対応
- ✅ 一貫したデザインシステム

## 🗂️ 画像ディレクトリ構成

### 現在の構成（public/images/）

```
public/images/
├── home/
│   ├── collections/     # ホームページコレクション画像
│   │   ├── collection_koshihikari.png
│   │   ├── collection_kamenoo.png
│   │   ├── collection_nikomaru.png
│   │   └── collection_nenkankeiyaku.png
│   └── parallax/        # パララックス背景画像
│       └── P3A0020.jpg
│
├── about/
│   ├── hero/            # Aboutページヒーロー画像
│   │   └── IMG_9172.jpg
│   ├── stances/         # スタンス画像（現在未使用）
│   └── stories/         # ストーリー画像
│       ├── IMG_8832.jpg
│       └── P3A9707.jpg
│
├── products/
│   ├── main/            # 商品メイン画像（未使用、外部URL使用中）
│   └── thumbnails/      # 商品サムネイル画像（未使用）
│
└── admin/
    ├── products/
    │   ├── uploads/     # アップロードされた商品画像
    │   └── temp/        # 一時画像
    └── assets/          # 管理画面UI画像
```

## 🔄 Supabase連動時の構成

### 1. データベース構造（Supabase PostgreSQL）

#### テーブル: `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  image TEXT, -- Supabase Storage URL
  images TEXT[], -- ギャラリー画像URL配列
  sold_out BOOLEAN DEFAULT false,
  handle TEXT UNIQUE NOT NULL, -- URL用スラッグ
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active' | 'draft' | 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_handle ON products(handle);
```

#### テーブル: `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items JSONB NOT NULL, -- 注文商品の配列
  payment_method TEXT,
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

#### テーブル: `customers`
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address JSONB,
  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active' | 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
```

#### テーブル: `discounts`
```sql
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'percentage' | 'fixed'
  value INTEGER NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER, -- NULL = 無制限
  status TEXT DEFAULT 'active', -- 'active' | 'inactive' | 'expired'
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_status ON discounts(status);
```

#### テーブル: `content`
```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'page' | 'blog' | 'announcement'
  content TEXT,
  status TEXT DEFAULT 'draft', -- 'published' | 'draft' | 'archived'
  author TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_status ON content(status);
```

### 2. Supabase Storage構造

```
バケット: product-images
├── main/
│   ├── koshihikari_2gou.png
│   ├── koshihikari_5kg.png
│   ├── koshihikari_10kg.png
│   ├── nikomaru_5kg.png
│   └── ...
└── thumbnails/
    ├── okome_sub_1.png
    └── ...

バケット: site-images
├── home/
│   ├── collections/
│   │   ├── collection_koshihikari.png
│   │   ├── collection_kamenoo.png
│   │   ├── collection_nikomaru.png
│   │   └── collection_nenkankeiyaku.png
│   └── parallax/
│       └── P3A0020.jpg
├── about/
│   ├── hero/
│   │   └── IMG_9172.jpg
│   └── stories/
│       ├── IMG_8832.jpg
│       └── P3A9707.jpg
└── ambassador/
    └── banner/
```

### 3. 認証（Supabase Auth）

```
- 管理者ログイン機能
- ロールベースアクセス制御
  - Admin: 全機能アクセス
  - Editor: 商品・コンテンツ編集のみ
- JWT トークン管理
```

### 4. フロントエンド構成（Supabase連動後）

```
現在の構成:
├── data/products.ts (削除 or フォールバック用に残す)
├── lib/
│   └── supabase.ts (新規) - Supabaseクライアント初期化
├── hooks/
│   ├── useProducts.ts (新規) - 商品データ取得フック
│   ├── useOrders.ts (新規) - 注文データ取得フック
│   ├── useCustomers.ts (新規) - 顧客データ取得フック
│   └── useAuth.ts (新規) - 認証フック
└── pages/admin/
    └── ProductEditor.tsx (更新) - Supabaseに保存
```

### 5. データフロー

```
管理者ページ
  ↓ (商品編集・保存)
ProductEditor.tsx
  ↓ (Supabase Client)
Supabase API
  ↓ (保存)
PostgreSQL Database
  ↓ (リアルタイム更新)
Supabase Realtime Subscription
  ↓ (自動反映)
EC側フロントエンド
  ↓ (商品表示)
Category.tsx / ProductDetail.tsx
```

### 6. 画像管理の移行

#### 現在（public/images/）
- 静的ファイルとして`public/`ディレクトリに配置
- ビルド時にバンドルに含まれる

#### Supabase連動後
- すべての画像をSupabase Storageにアップロード
- 画像URLはデータベースに保存
- 動的な画像アップロード・削除が可能
- CDN経由で高速配信

### 7. 必要なパッケージ追加

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

### 8. 環境変数設定

`.env.local`ファイルを作成:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (サーバーサイドのみ)
```

### 9. 主な変更点

#### データ取得の変更
```typescript
// 現在
import { products } from '../data/products';

// Supabase連動後
import { useProducts } from '../hooks/useProducts';
const { products, loading, error } = useProducts();
```

#### 商品保存の変更
```typescript
// 現在
const handleSubmit = () => {
  console.log('商品データ:', productData);
  alert('商品を保存しました');
};

// Supabase連動後
const handleSubmit = async () => {
  const { data, error } = await supabase
    .from('products')
    .upsert(productData);
  if (error) {
    console.error('保存エラー:', error);
  } else {
    alert('商品を保存しました');
  }
};
```

#### 画像アップロードの変更
```typescript
// Supabase連動後
const uploadImage = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `main/${fileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  if (error) {
    console.error('アップロードエラー:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrl;
};
```

### 10. Row Level Security (RLS) ポリシー

```sql
-- products テーブル
-- 全ユーザーが商品を閲覧可能
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- 管理者のみ商品を編集可能
CREATE POLICY "Products are editable by admins"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- orders テーブル
-- 管理者のみ注文を閲覧可能
CREATE POLICY "Orders are viewable by admins"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

## 🛠️ 技術スタック

### 現在
- **フレームワーク**: React 18.2.0
- **ビルドツール**: Vite 6.2.0
- **言語**: TypeScript 5.8.2
- **ルーティング**: Wouter 2.11.0
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React 0.263.1

### Supabase連動後（追加）
- **バックエンド**: Supabase (PostgreSQL + Storage + Auth)
- **リアルタイム**: Supabase Realtime
- **認証**: Supabase Auth

## 📝 今後の実装予定

- [ ] Supabase連動
- [ ] 認証機能（管理者ログイン）
- [ ] 商品データの永続化
- [ ] 画像のSupabase Storage移行
- [ ] リアルタイム更新機能
- [ ] 注文処理機能
- [ ] 決済連携

## 📄 ライセンス

Private
