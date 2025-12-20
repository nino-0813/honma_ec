export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // 環境変数から認証情報を取得（Edge Functions では Deno.env.get を使用）
  const adminUser = Deno.env.get('ADMIN_BASIC_AUTH_USER') || '';
  const adminPass = Deno.env.get('ADMIN_BASIC_AUTH_PASS') || '';

  // 環境変数が設定されていない場合は認証をスキップ（開発環境用）
  if (!adminUser || !adminPass) {
    return Response.redirect(new URL('/index.html', request.url), 302);
  }

  // Basic認証のヘッダーを確認
  const authHeader = request.headers.get('authorization');

  // Basic認証の検証
  if (authHeader) {
    const base64Credentials = authHeader.split(' ')[1];
    // Edge Functions では Buffer が使えないため、atob を使用
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');

    if (username === adminUser && password === adminPass) {
      // 認証成功: index.html にリダイレクト
      return Response.redirect(new URL('/index.html', request.url), 302);
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

