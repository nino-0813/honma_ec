import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

/**
 * ルートレイアウト: HelmetProvider + OAuth/Admin リダイレクト処理
 * SSG 時もクライアントで実行されるリダイレクトのみここで行う
 */
const RootLayout = () => {
  useEffect(() => {
    const pathname = window.location.pathname || '/';
    const hash = window.location.hash;

    // 旧ハッシュルート (#/admin, #/admin/login) をパスベースにリダイレクト
    if (pathname === '/' && hash && hash.startsWith('#/admin')) {
      const path = hash.slice(1); // '#/admin' -> '/admin'
      window.location.replace(path + window.location.search);
      return;
    }

    // パスワード再設定メールのリンクは Supabase の Site URL（トップ /）に飛ぶことが多い。
    // そのままだとトップで終わり再設定フォームに届かない。また OAuth 用の auth_redirect（チェックアウト等）
    // と同じく access_token を含むため、誤って別ページへばされていた。
    const isPasswordRecoveryHash = hash.includes('type=recovery');
    if (isPasswordRecoveryHash && !pathname.includes('account/reset-password')) {
      window.location.replace(
        `${window.location.origin}/account/reset-password${window.location.search}${hash}`
      );
      return;
    }

    // Google ログイン後の OAuth リダイレクト（パスワード再設定フローは除外）
    if (hash && hash.includes('access_token=') && !isPasswordRecoveryHash) {
      const redirectPath = localStorage.getItem('auth_redirect');
      if (redirectPath) {
        const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
        localStorage.removeItem('auth_redirect');
        window.location.replace(path + window.location.search + window.location.hash);
        return;
      }
    }

    // Basic認証後のリダイレクト処理
    const adminReturnPath = sessionStorage.getItem('admin_return_path');
    if (adminReturnPath && (pathname === '/' || pathname === '/index.html' || pathname === '/admin')) {
      sessionStorage.setItem('basic_auth_passed', 'true');
      sessionStorage.removeItem('admin_return_path');
      const to = adminReturnPath.startsWith('/') ? adminReturnPath : `/${adminReturnPath}`;
      window.location.replace(to);
    } else if (pathname === '/admin' && !adminReturnPath) {
      sessionStorage.setItem('basic_auth_passed', 'true');
    }
  }, []);

  return (
    <HelmetProvider>
      <Outlet />
      <VercelAnalytics />
    </HelmetProvider>
  );
};

export default RootLayout;
