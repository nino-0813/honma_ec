import React, { Suspense } from 'react';
import type { RouteRecord } from 'vite-react-ssg';
import RootLayout from './RootLayout';
import MainLayout from './App'; // MainLayout を App から export する想定
import Home from './pages/Home';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
);

const About = React.lazy(() => import('./pages/About'));
const Category = React.lazy(() => import('./pages/Category'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const AmbassadorProductDetail = React.lazy(() => import('./pages/AmbassadorProductDetail'));
const Ambassador = React.lazy(() => import('./pages/Ambassador'));
const Blog = React.lazy(() => import('./pages/Blog'));
const BlogDetail = React.lazy(() => import('./pages/BlogDetail'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const Terms = React.lazy(() => import('./pages/Terms'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const LegalNotice = React.lazy(() => import('./pages/LegalNotice'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const CheckoutSuccess = React.lazy(() => import('./pages/CheckoutSuccess'));
const MyPage = React.lazy(() => import('./pages/MyPage'));
const OrderDetail = React.lazy(() => import('./pages/OrderDetail'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminRoutes = React.lazy(() => import('./pages/AdminRoutesWrapper'));

const CheckoutWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <Checkout />
  </Suspense>
);

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '',
        element: <MainLayout />,
        children: [
          { index: true, Component: Home },
          { path: 'about', Component: About },
          { path: 'collections/rice/:subcategory', Component: Category },
          { path: 'collections/:category', Component: Category },
          { path: 'collections', Component: Category },
          { path: 'products/ambassador', Component: AmbassadorProductDetail },
          {
            path: 'products/:handle',
            Component: ProductDetail,
            getStaticPaths: () => [], // ビルド時に静的パスを増やしたい場合はここで返す
          },
          { path: 'ambassador', Component: Ambassador },
          { path: 'blog', Component: Blog },
          {
            path: 'blog/:id',
            Component: BlogDetail,
            getStaticPaths: () => [],
          },
          { path: 'contact', Component: ContactPage },
          { path: 'terms', Component: Terms },
          { path: 'faq', Component: FAQ },
          { path: 'legal', Component: LegalNotice },
          { path: 'checkout', Component: CheckoutWithSuspense },
          { path: 'checkout/success', Component: CheckoutSuccess },
          { path: 'mypage/orders/:orderId', Component: OrderDetail },
          { path: 'mypage', Component: MyPage },
          { path: 'account', Component: MyPage },
        ],
      },
      {
        path: 'admin/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminLogin />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminRoutes />
          </Suspense>
        ),
      },
      {
        path: 'admin/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminRoutes />
          </Suspense>
        ),
      },
    ],
  },
];
