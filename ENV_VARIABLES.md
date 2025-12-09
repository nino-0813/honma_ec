# 環境変数設定ガイド

このドキュメントでは、Vercelでデプロイする際に必要な環境変数の設定方法を説明します。

## 📋 必要な環境変数

### 必須環境変数

#### 1. Supabase設定
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**取得方法:**
1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. Settings > API に移動
4. `Project URL` と `anon public` キーをコピー

#### 2. Stripe設定
```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**取得方法:**
1. Stripeダッシュボードにログイン
2. Developers > API keys に移動
3. Publishable key をコピー（テスト環境または本番環境）

### オプション環境変数（メール送信機能用）

#### 3. Resend API設定（Vercel Serverless Function用）
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_email@domain.com
```

**取得方法:**
1. Resendアカウントを作成（https://resend.com）
2. API Keys セクションでAPIキーを作成
3. Domains セクションでドメインを検証（またはデフォルトの `onboarding@resend.dev` を使用）

**注意:** Vercel Serverless Functionでは `RESEND_API_KEY` と `RESEND_FROM_EMAIL` を使用します（`VITE_` プレフィックスなし）。

## 🔧 Vercelでの環境変数設定方法

### 1. Vercelダッシュボードから設定

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings > Environment Variables に移動
4. 以下の環境変数を追加：

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY (オプション)
RESEND_FROM_EMAIL (オプション)
```

5. 各環境（Production, Preview, Development）に適用するか選択
6. Save をクリック

### 2. 環境変数の適用範囲

- **Production**: 本番環境（https://your-domain.vercel.app）
- **Preview**: プルリクエストやブランチのプレビュー
- **Development**: ローカル開発環境（`vercel dev` コマンド使用時）

**推奨:** すべての環境に同じ値を設定するか、テスト用と本番用で分ける場合は Production と Preview/Development で異なる値を設定できます。

## ⚠️ 重要な注意事項

1. **セキュリティ**: 
   - `VITE_` プレフィックス付きの環境変数はクライアント側に公開されます
   - 機密情報（Secret Keys）は `VITE_` プレフィックスを付けないでください
   - Resend APIキーは `RESEND_API_KEY` として設定（`VITE_` なし）

2. **環境変数の再デプロイ**:
   - 環境変数を追加・変更した後は、**再デプロイが必要**です
   - Vercelダッシュボードから「Redeploy」を実行してください

3. **ローカル開発**:
   - `.env.local` ファイルに環境変数を設定
   - `.env.local` は `.gitignore` に含まれているため、GitHubにコミットされません

## 🔍 環境変数の確認方法

デプロイ後、以下の方法で環境変数が正しく設定されているか確認できます：

1. **ブラウザのコンソール**:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL);
   ```

2. **Vercelダッシュボード**:
   - Settings > Environment Variables で設定済みの変数を確認

3. **ログ確認**:
   - Vercelダッシュボードの Functions タブでエラーログを確認

## 📝 環境変数チェックリスト

デプロイ前に以下を確認してください：

- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` が設定されている
- [ ] メール送信機能を使用する場合、`RESEND_API_KEY` と `RESEND_FROM_EMAIL` が設定されている
- [ ] すべての環境変数が正しい環境（Production/Preview/Development）に適用されている
- [ ] 環境変数設定後に再デプロイを実行した

