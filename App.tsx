
import React, { useState, useEffect, createContext } from 'react';
import { Route, Switch, useLocation, Router } from 'wouter';
import Header from './components/Header';
import Footer from './components/Footer';
import { CartDrawer, MenuDrawer } from './components/Drawers';
import Home from './pages/Home';
import About from './pages/About';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Ambassador from './pages/Ambassador';
import ContactPage from './pages/ContactPage';
import Dashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import ProductEditor from './pages/admin/ProductEditor';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import Discounts from './pages/admin/Discounts';
import Content from './pages/admin/Content';
import Market from './pages/admin/Market';
import Finance from './pages/admin/Finance';
import Analytics from './pages/admin/Analytics';

// Context for global actions
export const CartContext = createContext<{ openCart: () => void }>({ openCart: () => {} });

// --- Hash Location Hook for Sandboxed Environments ---
const useHashLocation = () => {
  const [loc, setLoc] = useState(window.location.hash.replace(/^#/, "") || "/");

  useEffect(() => {
    const handler = () => setLoc(window.location.hash.replace(/^#/, "") || "/");
    // Subscribe to hash changes
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return [loc, navigate] as [string, (to: string) => void];
};

// Scroll to top component ensuring navigation always starts at top
const ScrollToTop = () => {
  const [pathname] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const MainLayout = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);

  return (
    <CartContext.Provider value={{ openCart }}>
      <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary selection:bg-black selection:text-white">
        <ScrollToTop />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenMenu={() => setIsMenuOpen(true)} 
        />
        
        <main className="flex-1">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/collections" component={Category} />
            <Route path="/collections/:category" component={Category} />
            <Route path="/products/:handle" component={ProductDetail} /> 
            <Route path="/ambassador" component={Ambassador} />
            <Route path="/contact" component={ContactPage} />
            
            {/* Catch-all fallback */}
            <Route component={Home} />
          </Switch>
        </main>

        <Footer />

        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </CartContext.Provider>
  );
};

// Admin Routes Component
const AdminRoutes = () => {
  return (
    <Switch>
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/products" component={ProductList} />
      <Route path="/admin/products/new" component={ProductEditor} />
      <Route path="/admin/products/:handle" component={ProductEditor} />
      <Route path="/admin/orders" component={Orders} />
      <Route path="/admin/customers" component={Customers} />
      <Route path="/admin/discounts" component={Discounts} />
      <Route path="/admin/content" component={Content} />
      <Route path="/admin/market" component={Market} />
      <Route path="/admin/finance" component={Finance} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route component={Dashboard} />
    </Switch>
  );
};

// Main App Router
const AppRouter = () => {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');

  if (isAdmin) {
    return <AdminRoutes />;
  }

  return <MainLayout />;
};

function App() {
  return (
    <Router hook={useHashLocation}>
      <AppRouter />
    </Router>
  );
}

export default App;
