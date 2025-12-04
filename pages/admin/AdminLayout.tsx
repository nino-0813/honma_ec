import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  IconDashboard, 
  IconPackage, 
  IconSettings, 
  IconHome, 
  IconUser,
  IconShoppingCart,
  IconUsers,
  IconMegaphone,
  IconPercent,
  IconMonitor,
  IconBuilding,
  IconBarChart,
  IconStore
} from '../../components/Icons';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, actions }) => {
  const [location] = useLocation();

  const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = location.startsWith(href);
    return (
      <Link href={href}>
        <a className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-gray-900 text-white shadow-md' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}>
          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
          {label}
        </a>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <Link href="/">
            <a className="flex items-center gap-2 group">
               <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-serif font-bold text-xs group-hover:opacity-80 transition-opacity">
                 IK
               </div>
               <span className="font-serif font-bold tracking-widest text-sm">IKEVEGE</span>
            </a>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem href="/admin" icon={IconDashboard} label="ホーム" />
          <NavItem href="/admin/orders" icon={IconShoppingCart} label="注文管理" />
          <NavItem href="/admin/products" icon={IconPackage} label="商品管理" />
          <NavItem href="/admin/customers" icon={IconUsers} label="顧客管理" />
          <NavItem href="/admin/marketing" icon={IconMegaphone} label="マーケティング" />
          <NavItem href="/admin/discounts" icon={IconPercent} label="ディスカウント" />
          <NavItem href="/admin/content" icon={IconMonitor} label="コンテンツ" />
          <NavItem href="/admin/market" icon={IconStore} label="マーケット" />
          <NavItem href="/admin/finance" icon={IconBuilding} label="財務" />
          <NavItem href="/admin/analytics" icon={IconBarChart} label="ストア分析" />
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">販売チャネル</p>
            <NavItem href="/" icon={IconHome} label="オンラインストア" />
          </div>
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">アプリ</p>
            <NavItem href="/admin/settings" icon={IconSettings} label="設定" />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
               <IconUser className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">Admin User</span>
              <span className="text-[10px] text-gray-400">admin@ikevege.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col bg-[#f4f4f4]">
        {/* Header - Only show if title is provided (for non-dashboard pages) */}
        {title && (
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 md:px-8 py-4 flex justify-between items-center h-16">
              <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
              <div className="flex items-center gap-4">
                {actions}
              </div>
            </div>
          </header>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
