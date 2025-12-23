import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Package, Store, User, Info, Grid2X2 } from 'lucide-react';
import StoreMenu from '../components/StoreMenu';
import { productAPI, categoryAPI } from '../services/api';
import { toast } from 'react-toastify';

interface MenuPageProps {
  user: any;
}

const MenuPage: React.FC<MenuPageProps> = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsCount, setProductsCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get store information from the user object passed as prop
        setStoreInfo(user);

        // Get products count
        const productsResponse = await productAPI.getList();
        if (productsResponse.success && productsResponse.data) {
          setProductsCount(productsResponse.data.length);
        }

        // Get categories count
        const categoriesResponse = await categoryAPI.list();
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategoriesCount(categoriesResponse.data.length);
        }

      } catch (err) {
        console.error('Failed to fetch store data:', err);
        setError(t('page.menu.failedToLoadStoreData'));
        toast.error(t('page.menu.failedToLoadStoreData'));
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [user._id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-medium text-foreground animate-pulse">{t('page.menu.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={() => navigate('/dashboard')}>{t('page.menu.backToDashboard')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('page.menu.backToDashboard')}</span>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('page.menu.title')}</h1>
        </div>
      </div>

      {/* Store Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>{t('page.menu.storeInformation')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{t('page.menu.storeName')}</div>
                  <div className="text-sm text-muted-foreground">{storeInfo?.name || storeInfo?.username || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{t('page.menu.username')}</div>
                  <div className="text-sm text-muted-foreground">{storeInfo?.username || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{t('page.menu.totalProducts')}</div>
                  <div className="text-sm text-muted-foreground">{productsCount}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Grid2X2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{t('page.menu.totalCategories')}</div>
                  <div className="text-sm text-muted-foreground">{categoriesCount}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>{t('page.menu.menuPreview')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <StoreMenu storeId={user._id} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={() => navigate('/products')}>
          {t('page.menu.manageProducts')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/categories')}>
          {t('page.menu.manageCategories')}
        </Button>
      </div>
    </div>
  );
};

export default MenuPage;
