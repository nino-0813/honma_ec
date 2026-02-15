import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import { useAdmin } from '../hooks/useAdmin';
import Dashboard from './admin/Dashboard';
import ProductList from './admin/ProductList';
import ProductEditor from './admin/ProductEditor';
import Orders from './admin/Orders';
import Customers from './admin/Customers';
import Discounts from './admin/Discounts';
import CouponEditor from './admin/CouponEditor';
import Content from './admin/Content';
import Market from './admin/Market';
import Finance from './admin/Finance';
import Analytics from './admin/Analytics';
import Inquiries from './admin/Inquiries';
import Reviews from './admin/Reviews';
import CustomerSupport from './admin/CustomerSupport';
import BlogManagement from './admin/BlogManagement';
import BlogEditor from './admin/BlogEditor';
import ShippingMethodManagement from './admin/ShippingMethodManagement';
import ShippingMethodEditor from './admin/ShippingMethodEditor';

const AdminRoutes = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('localhost');

    if (isLocalhost) return;

    const currentPath = pathname || '/';
    if (currentPath === '/admin/login') return;

    const basicAuthPassed = sessionStorage.getItem('basic_auth_passed');
    if (basicAuthPassed === 'true') return;

    if (currentPath.startsWith('/admin')) {
      const returnPath = currentPath;
      sessionStorage.setItem('admin_return_path', returnPath);
      window.location.href = '/admin';
      return;
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && isAdmin === false) {
      if (pathname !== '/admin/login') {
        navigate('/admin/login');
      }
    }
  }, [isAdmin, loading, navigate, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-500">認証を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="products/new" element={<ProductEditor />} />
        <Route path="products/:handle" element={<ProductEditor />} />
        <Route path="products" element={<ProductList />} />
        <Route path="shipping-methods/new" element={<ShippingMethodEditor />} />
        <Route path="shipping-methods/:id" element={<ShippingMethodEditor />} />
        <Route path="shipping-methods" element={<ShippingMethodManagement />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="discounts/new" element={<CouponEditor />} />
        <Route path="discounts/:id" element={<CouponEditor />} />
        <Route path="discounts" element={<Discounts />} />
        <Route path="content" element={<Content />} />
        <Route path="market" element={<Market />} />
        <Route path="finance" element={<Finance />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="customer-support" element={<CustomerSupport />} />
        <Route path="blog/new" element={<BlogEditor />} />
        <Route path="blog/:id" element={<BlogEditor />} />
        <Route path="blog" element={<BlogManagement />} />
        <Route path="/" element={<Dashboard />} />
        <Route index element={<Dashboard />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
