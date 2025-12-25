import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css'
import type { User } from '@/services/api';

import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Products from './pages/Products.tsx';
import Categories from './pages/Categories.tsx';
import Orders from './pages/Orders.tsx';
import Messages from './pages/Messages.tsx';
import People from './pages/People.tsx';
import MyCart from './pages/Cart.tsx';
import Public from './pages/Public.tsx';
import Profile from './pages/Profile.tsx';
import Navigation from './components/Navigation.tsx';
import Account from './pages/Account.tsx';
import Themes from './pages/Themes.tsx';
import ImageManagement from './pages/ImageManagement.tsx';
import Catalogs from './pages/Catalogs.tsx';
import CreateCatalog from './pages/CreateCatalog.tsx';
import PublicCatalogs from './pages/PublicCatalogs.tsx';
import PublicCatalog from './pages/PublicCatalog.tsx';
import MenuPage from './pages/MenuPage.tsx';
import useFavicon from './hooks/use-favicon.ts';

const App: React.FC = () => {
  const navigate = useNavigate();
  const initialLocation = useRef(window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);

  useFavicon(user?.role);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user') || localStorage.getItem('userJsonString');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      // Ensure user object has _id field for consistency
      const userWithId = { ...parsedUser, _id: parsedUser.userId || parsedUser._id };
      setIsAuthenticated(true);
      setUser(userWithId);
      // Navigate back to initial location if it was an authenticated route
      if (initialLocation.current !== '/login' && initialLocation.current !== '/register' && !initialLocation.current.startsWith('/public')) {
        navigate(initialLocation.current);
      }
    }
  }, []);

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userId', userData._id);
    localStorage.setItem('userRole', userData.role);
    setIsAuthenticated(true);
    setUser(userData);
    console.log(JSON.stringify(userData));

  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUser(undefined);
  };

  const handleStatusChange = (newStatus: string) => {
    if (user) {
      const updatedUser = { ...user, statusMain: newStatus };
      setUser(updatedUser);
      console.log(updatedUser);

      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Here you could also make an API call to update the status on the server

    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <Navigation user={user} onLogout={handleLogout} onStatusChange={handleStatusChange} />}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          {/* Public routes - accessible without authentication */}
          <Route path="/public/profile/:targetUserId" element={<Public />} />
          <Route path="/cart" element={<MyCart user={user} />} />
          <Route path="/catalog/public/:catalogId" element={<PublicCatalog />} />
          <Route path="/orders" element={<Orders user={user} />} />

          {!isAuthenticated ? (
            <>
              <Route path="/catalogs" element={<PublicCatalogs />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard user={user!} />} />
              <Route path="/account" element={<Account user={user!} onUserUpdate={handleUserUpdate} />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/public/catalog/:catalogId" element={<PublicCatalog />} />

              <Route path="/products" element={<Products user={user!} />} />
              <Route path="/categories" element={<Categories user={user!} />} />
              <Route path="/orders" element={<Orders user={user!} />} />
              <Route path="/messages" element={<Messages user={user!} />} />
              <Route path="/people" element={<People user={user!} />} />
              <Route path="/themes" element={<Themes user={user!} />} />
              <Route path="/images" element={<ImageManagement user={user!} />} />
              <Route path="/catalogs" element={<Catalogs />} />
              <Route path="/catalogs/create" element={<CreateCatalog />} />
              <Route path="/public-catalogs" element={<PublicCatalogs />} />
              <Route path="/menu" element={<MenuPage user={user!} />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </main>
      <ToastContainer />
    </div>
  );
};

const AppWrapper: React.FC = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;