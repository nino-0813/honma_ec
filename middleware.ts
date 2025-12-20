export const config = {
  matcher: [
    '/admin/:path*',
  ],
};

export default function middleware(request: Request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 環境変数から認証情報を取得
    const adminUser = Deno.env.get('ADMIN_BASIC_AUTH_USER') || '';
    const adminPass = Deno.env.get('ADMIN_BASIC_AUTH_PASS') || '';

    // 環境変数が設定されていない場合は認証をスキップ（開発環境用）
    if (!adminUser || !adminPass) {
      // 環境変数が設定されていない場合、リクエストをそのまま通過
      return new Response(null, {
        status: 200,
      });
    }

    // `/admin` パスで始まる場合のみ Basic認証を要求
    if (pathname.startsWith('/admin')) {
      // Basic認証のヘッダーを確認
      const authHeader = request.headers.get('authorization');

      // Basic認証の検証
      if (authHeader && authHeader.startsWith('Basic ')) {
        try {
          const base64Credentials = authHeader.split(' ')[1];
          const credentials = atob(base64Credentials);
          const [username, password] = credentials.split(':');

          if (username === adminUser && password === adminPass) {
            // 認証成功: リクエストをそのまま通過
            return new Response(null, {
              status: 200,
            });
          }
        } catch (e) {
          console.error('Basic認証の解析エラー:', e);
        }
      }

      // 認証失敗または認証ヘッダーがない場合、401を返す
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    // 管理画面以外のリクエストはそのまま通過
    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    // エラーが発生した場合、ログを出力してリクエストを通過させる
    console.error('Middleware error:', error);
    return new Response(null, {
      status: 200,
    });
  }
}

