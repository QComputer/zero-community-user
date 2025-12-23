import { Home, Package, FileText, Palette, User as UserIcon, Image as ImageIcon, Menu, BookOpen, Grid2X2 } from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: any;
  roles: string[];
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

export const menuItems: MenuItem[] = [
  // Core navigation items
  {
    path: '/dashboard',
    label: 'common.home',
    icon: Home,
    roles: ['customer','driver', 'store', 'admin', 'guest', 'staff'],
  },
  {
    path: '/products',
    label: 'common.products',
    icon: Package,
    roles: ['store', 'admin', 'staff'],
  },
  {
    path: '/categories',
    label: 'common.categories',
    icon: Grid2X2,
    roles: ['admin', 'store', 'staff'],
  },
  // Store-specific items
  {
    path: '/menu',
    label: 'common.menu',
    icon: Menu,
    roles: ['store', 'staff'],
  },
  {
    path: '/catalogs',
    label: 'common.catalogs',
    icon: BookOpen,
    roles: ['store', 'admin', 'staff'],
  },
  {
    path: '/public-catalogs',
    label: 'common.catalogs',
    icon: BookOpen,
    roles: ['customer', 'guest'],
  },
  // Admin-specific items
  {
    path: '/templates',
    label: 'common.templates',
    icon: FileText,
    roles: ['admin'],
  },
  {
    path: '/themes',
    label: 'common.themes',
    icon: Palette,
    roles: ['admin'],
  },
  {
    path: '/users',
    label: 'common.users',
    icon: UserIcon,
    roles: ['admin'],
  },
  {
    path: '/images',
    label: 'common.images',
    icon: ImageIcon,
    roles: ['admin'],
  },


];

export const filterMenuItems = (userRole: string | undefined, screenSize: 'mobile' | 'desktop' | 'icon' = 'desktop'): MenuItem[] => {
  if (!userRole) return [];

  return menuItems.filter(item => {
    // Filter by role
    const roleMatch = item.roles.includes(userRole);

    // Filter by screen size
    if (screenSize === 'mobile' && item.desktopOnly) return false;
    if (screenSize === 'desktop' && item.mobileOnly) return false;

    return roleMatch;
  });
};

export const getMenuStructure = (userRole: string | undefined) => {
  const mobileItems = filterMenuItems(userRole, 'mobile');
  const desktopItems = filterMenuItems(userRole, 'desktop');
  const iconItems = filterMenuItems(userRole, 'icon');

  return {
    mobile: mobileItems,
    desktop: desktopItems,
    icon: iconItems,
  };
};