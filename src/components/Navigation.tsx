import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { logNavigation, logUserAction } from '../services/logger';
import { userAPI, orderAPI } from '../services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { useClickOutside } from '../hooks/useClickOutside';
import { useTheme } from '../hooks/use-theme';
import useCart from '../hooks/useCart';
import { UserIcon, LogOut, Wifi, WifiOff, Clock, AlertTriangle, Menu, MessageSquare, ClipboardList, Package, Users, Search, ShoppingCart, Globe, Palette } from 'lucide-react';

import type { User } from '../services/api';
import { messageAPI } from '../services/api';
import { filterMenuItems } from '../config/menuConfig';

interface NavigationProps {
  user: User | undefined;
  onLogout: () => void;
  onStatusChange?: (status: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout, onStatusChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('fa');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [placedOrders, setPlacedOrders] = useState(0);
  const [acceptedOrders, setAcceptedOrders] = useState(0);
  const [availableOrders, setAvailableOrders] = useState(0);
  const { getTotalItems } = useCart();

  // Get filtered menu items based on user role
  const mobileMenuItems = filterMenuItems(user?.role, 'mobile');
  const desktopMenuItems = filterMenuItems(user?.role, 'desktop');
  const iconMenuItems = filterMenuItems(user?.role, 'icon');

  // Click outside refs for menu components
  const mobileMenuRef = useClickOutside<HTMLDivElement>(() => setIsMobileMenuOpen(false), [setIsMobileMenuOpen]);
  const mobileSearchRef = useClickOutside<HTMLDivElement>(() => setIsMobileSearchOpen(false), [setIsMobileSearchOpen]);
  const desktopSearchRef = useClickOutside<HTMLDivElement>(() => setIsSearchOpen(false), [setIsSearchOpen, searchQuery]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch(searchQuery);
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  // Fetch notification counts
  useEffect(() => {
    if (user) {
      fetchNotificationCounts();
    }
  }, [user]);

  // Listen for order updates to refresh counts
  useEffect(() => {
    const handleOrderUpdate = () => {
      if (user) {
        fetchNotificationCounts();
      }
    };

    window.addEventListener('orderUpdate', handleOrderUpdate);

    return () => {
      window.removeEventListener('orderUpdate', handleOrderUpdate);
    };
  }, [user]);

  // Refresh notification counts when navigating or focusing
  useEffect(() => {
    const handleFocus = () => {
      if (user?.role === 'store') {
        setTimeout(() => fetchNotificationCounts(), 100);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Also refresh on navigation changes
    const handleNavigation = () => {
      if (user?.role === 'store') {
        setTimeout(() => fetchNotificationCounts(), 100);
      }
    };

    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [user]);

  const fetchNotificationCounts = async () => {
    try {
      // Fetch unread messages count using messageAPI
      const messagesResponse = await messageAPI.getUnreadMessages();
      if (messagesResponse.success) {
        setUnreadMessages(messagesResponse.data ? messagesResponse.data.length : 0);
      } else {
        setUnreadMessages(0);
      }

      // Fetch orders count (placed + accepted) based on role using the new unified dashboard stats endpoint
      const statsResponse = await orderAPI.getDashboardStatistics();
      if (statsResponse.success && statsResponse.data) {
        const stats = statsResponse.data;

        if (user?.role === 'store') {
          setPlacedOrders(stats.placedOrders || 0);
          setAcceptedOrders(stats.acceptedOrders || 0);
          setPendingOrders((stats.placedOrders || 0) + (stats.acceptedOrders || 0));
        } else if (user?.role === 'driver') {
          setPendingOrders(stats.pendingOrders || 0);
          setAvailableOrders(stats.availableOrders || 0);
        } else if (user?.role === 'customer' || user?.role === 'admin') {
          setPendingOrders(stats.pendingOrders || 0);
        }
      }

      // Cart count is now managed by useCart hook - no need to fetch separately

    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };



  const performSearch = async (query: string) => {
    try {
      // Search products
      const productResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product/all`, {
        headers: {
          'token': localStorage.getItem('token') || ''
        }
      });
      const productData = await productResponse.json();

      // Search users
      const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/all`, {
        headers: {
          'token': localStorage.getItem('token') || ''
        }
      });
      const userData = await userResponse.json();

      // Filter results
      const filteredProducts = productData.success ? productData.data.filter((product: any) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.category?.name?.toLowerCase().includes(query.toLowerCase())
      ) : [];

      const filteredUsers = userData.success ? userData.data.filter((user: any) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase())
      ) : [];

      setSearchResults({
        products: filteredProducts.slice(0, 5), // Limit to 5 results
        users: filteredUsers.slice(0, 5)
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ products: [], users: [] });
    }
  };

  const handleLogout = () => {
    logUserAction('logout', { userId: user?._id, role: user?.role });
    onLogout();
    navigate('/login');
  };

  const handleNavigation = (to: string) => {
    logNavigation(window.location.pathname, to);
  };

  const handleAccountClick = () => {
    handleNavigation('/account');
    navigate('/account');
  };

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = user?.statusMain;
    if (newStatus === oldStatus) return; // No change needed

    try {
      const res = await userAPI.updateStatus(newStatus);
      if (res.success && res.data && res.data.statusMain) {
        onStatusChange?.(res.data.statusMain);
        logUserAction('status_change', { userId: user?._id, oldStatus, newStatus });
      } else {
        console.error('Failed to update status:', res);
      }
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  // Helper function to render menu items
  const renderMenuItem = (item: any, isMobile: boolean = false, onClick?: () => void) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={() => {
          handleNavigation(item.path);
          if (isMobile) setIsMobileMenuOpen(false);
          if (onClick) onClick();
        }}
        className={`flex items-center ${isMobile ? 'px-3 py-2 rounded-md hover:bg-accent' : 'hover:text-primary font-medium'} transition-colors text-foreground`}
      >
        {isMobile && <Icon className="mr-3 h-5 w-5" />}
        <span>{t(item.label)}</span>
      </Link>
    );
  };

  // Helper function to render icon menu items
  const renderIconMenuItem = (item: any) => {
    const Icon = item.icon;
    return (
      <Button
        key={item.path}
        variant="ghost"
        className="h-10 w-10 rounded-full hover:bg-accent transition-colors"
        onClick={() => { handleNavigation(item.path); navigate(item.path); }}
      >
        <Icon className="h-5 w-5" />
      </Button>
    );
  };

  return (
    <nav className="p-4 backdrop-blur-sm bg-background/80 sticky top-0 z-50" dir="ltr">
      <div className="grid grid-cols-3 items-center max-w-8xl mx-auto gap-5">
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="text-l font-bold text-primary">{t('common.zero')}</div>
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full hover:bg-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            {iconMenuItems.map(renderIconMenuItem)}
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            {desktopMenuItems.map(item => renderMenuItem(item, false))}
          </div>
        </div>
        <div className="flex justify-center">
          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center max-w-50 w-full">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-12 py-2 rounded-full border-2 border-muted focus:border-primary transition-colors w-full"
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-primary/10"
                onClick={() => performSearch(searchQuery)}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
            {isSearchOpen && (
              <div ref={desktopSearchRef} className="absolute top-full left-0 right-0 bg-background border rounded-lg shadow-lg mt-1 z-50 max-h-96 overflow-y-auto">
                {searchResults.products && searchResults.products.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t('common.products')}</h4>
                    {searchResults.products.map((product: any) => (
                      <div key={product._id} className="flex items-center p-2 hover:bg-accent rounded cursor-pointer" onClick={() => navigate('/products')}>
                        <Package className="h-4 w-4 mr-2" />
                        <span>{product.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">{product.category?.name || t('common.notProvided')}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.users && searchResults.users.length > 0 && (
                  <div className="p-4 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t('common.people')}</h4>
                    {searchResults.users.map((user: any) => (
                      <div key={user._id} className="flex items-center p-2 hover:bg-accent rounded cursor-pointer" onClick={() => navigate(`/profile`)}>
                        <Users className="h-4 w-4 mr-2" />
                        <span>{user.name || user.username}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Search Icon */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Search Dropdown */}
          {isMobileSearchOpen && (
            <div ref={mobileSearchRef} className="md:hidden absolute top-full left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl z-40 p-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-12 py-2 rounded-full border-2 border-muted focus:border-primary transition-colors w-full"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-primary/10"
                  onClick={() => performSearch(searchQuery)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {isSearchOpen && (
                <div className="mt-4 max-h-64 overflow-y-auto">
                  {searchResults.products && searchResults.products.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t('common.products')}</h4>
                      {searchResults.products.map((product: any) => (
                        <div key={product._id} className="flex items-center p-2 hover:bg-accent rounded cursor-pointer" onClick={() => { navigate('/products'); setIsMobileSearchOpen(false); }}>
                          <Package className="h-4 w-4 mr-2" />
                          <span>{product.name}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">{product.category?.name || t('common.notProvided')}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.users && searchResults.users.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t('common.people')}</h4>
                      {searchResults.users.map((user: any) => (
                        <div key={user._id} className="flex items-center p-2 hover:bg-accent rounded cursor-pointer" onClick={() => { navigate(`/profile`); setIsMobileSearchOpen(false); }}>
                          <Users className="h-4 w-4 mr-2" />
                          <span>{user.name || user.username}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">{user.role}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end  space-x-2 lg:space-x-5">
          {(user?.role === 'customer' || user?.role === 'guest') && (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-10 w-10 rounded-full hover:bg-accent transition-colors"
              onClick={() => { handleNavigation('/cart'); navigate('/cart'); }}
            >
              <ShoppingCart className="h-8 w-8" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-constructive text-xs flex items-center justify-center p-0">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          )}
          {(user?.role === 'store' || user?.role === 'admin' || user?.role === 'guest' || user?.role === 'customer' || user?.role === 'driver') && (
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full hover:bg-accent transition-colors"
              onClick={() => { handleNavigation('/orders'); navigate('/orders'); }}
            >
              <ClipboardList className="h-8 w-8" />
              {user.role === 'store' ? (
                <>
                  {placedOrders > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-black text-xs flex items-center justify-center p-0" style={{ backgroundColor: 'var(--order-status-placed)' }}>
                      {placedOrders > 9 ? '9+' : placedOrders}
                    </Badge>
                  )}
                  {acceptedOrders > 0 && (
                    <Badge className="absolute -top-1 -left-1 h-4 w-4 rounded-full text-black text-xs flex items-center justify-center p-0" style={{ backgroundColor: 'var(--order-status-accepted)' }}>
                      {acceptedOrders > 9 ? '9+' : acceptedOrders}
                    </Badge>
                  )}
                </>
              ) : user.role === 'driver' ? (
                <>
                  {pendingOrders > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-black text-xs flex items-center justify-center p-0">
                      {pendingOrders > 9 ? '9+' : pendingOrders}
                    </Badge>
                  )}
                  {availableOrders > 0 && (
                    <Badge className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center p-0">
                      {availableOrders > 9 ? '9+' : availableOrders}
                    </Badge>
                  )}
                </>
              ) : (
                pendingOrders > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-black text-xs flex items-center justify-center p-0">
                    {pendingOrders > 99 ? '99+' : pendingOrders}
                  </Badge>
                )
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="relative h-10 w-10 rounded-full hover:bg-accent transition-colors"
            onClick={() => { handleNavigation('/messages'); navigate('/messages'); }}
          >
            <MessageSquare className="h-5 w-5" />
            {unreadMessages > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-black text-xs flex items-center justify-center p-0">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </Badge>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost"
                className="relative h-8 w-8 rounded-full p-0">
                <div className="relative rounded-full p-0.5 ring-2" style={{
                  '--tw-ring-color': user?.statusMain === 'online' ? 'var(--status-online)' :
                    user?.statusMain === 'offline' ? 'var(--status-offline)' :
                      user?.statusMain === 'busy' ? 'var(--status-busy)' :
                        user?.statusMain === 'soon' ? 'var(--status-soon)' :
                          'var(--muted-foreground)'
                } as React.CSSProperties}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name || user?.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={handleAccountClick}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>{t('common.profile')}</span>
              </DropdownMenuItem>

              {/* Status Selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer">
                    {user?.statusMain === 'online' ? (
                      <Wifi className="mr-2 h-4 w-4" style={{ color: 'var(--status-online)' }} />
                    ) : user?.statusMain === 'offline' ? (
                      <WifiOff className="mr-2 h-4 w-4" style={{ color: 'var(--status-offline)' }} />
                    ) : user?.statusMain === 'busy' ? (
                      <AlertTriangle className="mr-2 h-4 w-4" style={{ color: 'var(--status-busy)' }} />
                    ) : user?.statusMain === 'soon' ? (
                      <Clock className="mr-2 h-4 w-4" style={{ color: 'var(--status-soon)' }} />
                    ) : (
                      <Wifi className="mr-2 h-4 w-4" />
                    )}
                    <span>{t('common.status')}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                      {user?.statusMain || t('common.unknown')}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="left">
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('online')}
                    className={user?.statusMain === 'online' ? 'bg-accent' : ''}
                  >
                    <Wifi className="mr-2 h-4 w-4" style={{ color: 'var(--status-online)' }} />
                    <span className={user?.statusMain === 'online' ? 'font-semibold' : ''}>{t('common.online')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('offline')}
                    className={user?.statusMain === 'offline' ? 'bg-accent' : ''}
                  >
                    <WifiOff className="mr-2 h-4 w-4" style={{ color: 'var(--status-offline)' }} />
                    <span className={user?.statusMain === 'offline' ? 'font-semibold' : ''}>{t('common.offline')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('busy')}
                    className={user?.statusMain === 'busy' ? 'bg-accent' : ''}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" style={{ color: 'var(--status-busy)' }} />
                    <span className={user?.statusMain === 'busy' ? 'font-semibold' : ''}>{t('common.busy')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('soon')}
                    className={user?.statusMain === 'soon' ? 'bg-accent' : ''}
                  >
                    <Clock className="mr-2 h-4 w-4" style={{ color: 'var(--status-soon)' }} />
                    <span className={user?.statusMain === 'soon' ? 'font-semibold' : ''}>{t('common.soon')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Language Selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    <span>{t('common.language')}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {currentLanguage.toUpperCase()}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="left">
                  <DropdownMenuItem
                    onClick={() => {
                      setCurrentLanguage('en');
                      i18n.changeLanguage('en');
                    }}
                    className={currentLanguage === 'en' ? 'bg-accent' : ''}
                  >
                    <span className={currentLanguage === 'en' ? 'font-semibold' : ''}>{t('common.english')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCurrentLanguage('fa');
                      i18n.changeLanguage('fa');
                    }}
                    className={currentLanguage === 'fa' ? 'bg-accent' : ''}
                  >
                    <span className={currentLanguage === 'fa' ? 'font-semibold' : ''}>{t('common.persian')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCurrentLanguage('tr');
                      i18n.changeLanguage('tr');
                    }}
                    className={currentLanguage === 'tr' ? 'bg-accent' : ''}
                  >
                    <span className={currentLanguage === 'tr' ? 'font-semibold' : ''}>{t('common.turkish')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCurrentLanguage('ar');
                      i18n.changeLanguage('ar');
                    }}
                    className={currentLanguage === 'ar' ? 'bg-accent' : ''}
                  >
                    <span className={currentLanguage === 'ar' ? 'font-semibold' : ''}>{t('common.arabic')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer">
                    <Palette className="mr-2 h-4 w-4" />
                    <span>{t('common.theme')}</span>
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="left">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    {t('common.light')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    {t('common.dark')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("minimalist-dark")}>
                    {t('common.minimalistDark')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("minimalist-blue")}>
                    {t('common.minimalistBlue')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("minimalist-green")}>
                    {t('common.minimalistGreen')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("minimalist-purple")}>
                    {t('common.minimalistPurple')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    {t('common.system')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden absolute top-full left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl z-40">
          <div className="flex flex-col space-y-1 p-2">
            {mobileMenuItems.map(item => renderMenuItem(item, true))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;