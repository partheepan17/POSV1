import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Receipt, 
  Warehouse, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Globe,
  Building2,
  ShoppingBag,
  PackageCheck,
  TrendingUp
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Layout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard, testId: 'nav-dashboard' },
    { name: t('pos'), href: '/pos', icon: ShoppingCart, testId: 'nav-pos' },
    { name: t('products'), href: '/products', icon: Package, testId: 'nav-products' },
    { name: t('customers'), href: '/customers', icon: Users, testId: 'nav-customers' },
    { name: t('sales'), href: '/sales', icon: Receipt, testId: 'nav-sales' },
    { name: t('inventory'), href: '/inventory', icon: Warehouse, testId: 'nav-inventory' },
    { name: t('reports'), href: '/reports', icon: BarChart3, testId: 'nav-reports' },
    { name: t('settings'), href: '/settings', icon: Settings, testId: 'nav-settings' },
  ];

  const handleLogout = () => {
    logout();
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent 
              navigation={navigation} 
              user={user} 
              onLogout={handleLogout}
              isActivePath={isActivePath}
              changeLanguage={changeLanguage}
              currentLanguage={i18n.language}
              t={t}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            navigation={navigation} 
            user={user} 
            onLogout={handleLogout}
            isActivePath={isActivePath}
            changeLanguage={changeLanguage}
            currentLanguage={i18n.language}
            t={t}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-button"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-semibold text-gray-900 capitalize">
                {location.pathname.split('/')[1] || 'Dashboard'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Language switcher */}
              <div className="language-toggle">
                <button 
                  className={`language-btn ${i18n.language === 'en' ? 'active' : ''}`}
                  onClick={() => changeLanguage('en')}
                  data-testid="lang-en"
                >
                  EN
                </button>
                <button 
                  className={`language-btn ${i18n.language === 'si' ? 'active' : ''}`}
                  onClick={() => changeLanguage('si')}
                  data-testid="lang-si"
                >
                  සි
                </button>
                <button 
                  className={`language-btn ${i18n.language === 'ta' ? 'active' : ''}`}
                  onClick={() => changeLanguage('ta')}
                  data-testid="lang-ta"
                >
                  த
                </button>
              </div>
              
              {/* User info */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-800">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, user, onLogout, isActivePath, changeLanguage, currentLanguage, t }) => (
  <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">POS System</span>
        </div>
      </div>
      
      <nav className="mt-8 flex-1 px-2 bg-white space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`${
                isActive
                  ? 'bg-primary-100 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors duration-200`}
              data-testid={item.testId}
            >
              <Icon
                className={`${
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 flex-shrink-0 h-6 w-6`}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
    
    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
      <div className="flex items-center w-full">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-800">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <button
          onClick={onLogout}
          className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          data-testid="logout-button"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

export default Layout;