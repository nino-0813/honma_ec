import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  first_name: string | null;
  last_name: string | null;
}

const STORAGE_KEY = 'ikevege_admin_cache';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(() => {
    // 初期値としてキャッシュを確認
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached).is_admin : null;
  });
  
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    // 初期値としてキャッシュを確認
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });

  // キャッシュがあれば最初はローディングしない
  const [loading, setLoading] = useState(() => !localStorage.getItem(STORAGE_KEY));
  
  const [, setLocation] = useLocation();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // 安全装置: 15秒経過してもロードが終わらない場合は強制終了
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('管理者チェックがタイムアウトしました。');
        setLoading(false); 
      }
    }, 15000);

    const checkAdmin = async () => {
      if (!supabase) {
        if (mountedRef.current) setLoading(false);
        return;
      }

      try {
        console.log('管理者権限チェックを開始します...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          console.log('ユーザーはログインしていません。');
          localStorage.removeItem(STORAGE_KEY); // キャッシュクリア
          if (mountedRef.current) {
            setIsAdmin(false);
            setAdminUser(null);
            // ログイン画面へのリダイレクトはAdminLayout等に任せるか、ここで行う
            // すでにログイン画面にいる場合はリダイレクトしない制御が必要だが、
            // 今回はAdminLayoutで制御しているのでここでは状態更新のみにするのが安全
             if (window.location.hash !== '#/admin/login') {
               setLocation('/admin/login');
             }
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, is_admin, first_name, last_name')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('プロフィール取得エラー:', profileError);
          // エラーでもキャッシュがあればそれを信じて表示を続ける（楽観的UI）
          if (!localStorage.getItem(STORAGE_KEY) && mountedRef.current) {
             setIsAdmin(false);
          }
          return;
        }

        if (profile?.is_admin === true) {
          const userData = {
            id: profile.id,
            email: profile.email || session.user.email || '',
            is_admin: profile.is_admin,
            first_name: profile.first_name,
            last_name: profile.last_name,
          };

          // キャッシュを更新
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

          if (mountedRef.current) {
            setIsAdmin(true);
            setAdminUser(userData);
          }
        } else {
          console.log('管理者権限がありません。');
          localStorage.removeItem(STORAGE_KEY);
          if (mountedRef.current) {
            setIsAdmin(false);
            setAdminUser(null);
            setLocation('/');
          }
        }
      } catch (err) {
        console.error('管理者権限チェックエラー:', err);
        // エラー時は何もしない（キャッシュがあればそれが表示される）
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem(STORAGE_KEY);
        setIsAdmin(false);
        setAdminUser(null);
        setLocation('/admin/login');
      } else if (event === 'SIGNED_IN') {
        checkAdmin();
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  return { isAdmin, adminUser, loading };
};
