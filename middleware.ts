export const config = {
  // すべてのリクエストで middleware を評価する。
  // ただし API・静的アセット・メンテナンスページ自体は除外（無駄な評価とリダイレクトループを防ぐ）。
  matcher: [
    '/((?!api|assets|images|fonts|favicon|maintenance\\.html|pw-recovery-redirect\\.html|robots\\.txt|sitemap\\.xml).*)',
  ],
};

// 環境変数を安全に取得する関数
function getEnvVar(key: string): string {
  try {
    // まずprocess.envを試す（Node.js環境）
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
  } catch (e) {
    // process.envが利用できない場合は無視
  }

  // process.envが使えない場合は空文字列を返す
  return '';
}

// メンテナンス中もアクセスを許可するパス（前方一致）
// マイページ（注文確認）・ログイン・API・管理画面・静的アセットは通す。
const ALLOWED_PREFIXES = [
  '/maintenance.html', // メンテナンスページ自体（リダイレクトループ防止）
  '/mypage', // マイページ（注文確認用）
  '/account', // ログイン／アカウント（マイページに入るため）
  '/api', // すべての API（マイページが内部で叩く）
  '/admin', // 管理画面（運用継続のため）
  '/assets', // Vite ビルド成果物（JS/CSS）
  '/images', // 静的画像
  '/fonts', // フォント
  '/recovery', // パスワード再設定リダイレクト
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

function isAllowed(pathname: string): boolean {
  return ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p)
  );
}

export default function middleware(request: Request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // メンテナンスモードのオン/オフを環境変数で制御（既定: オフ）
    const maintenanceMode = getEnvVar('MAINTENANCE_MODE') === 'true';

    if (!maintenanceMode) {
      // 通常時はすべて素通し（従来どおりの挙動）
      return;
    }

    // 許可パスはそのまま通す
    if (isAllowed(pathname)) {
      return;
    }

    // それ以外は /maintenance.html へリダイレクト（307: 一時的）
    return Response.redirect(new URL('/maintenance.html', url.origin).toString(), 307);
  } catch (error) {
    // エラー時はリクエストを通過させる（サイトを落とさない）
    console.error('Middleware error:', error);
    return;
  }
}
