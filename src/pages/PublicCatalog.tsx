import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';
import StoreMenu from '@/components/StoreMenu';
import ProfileHeader from '../components/ProfileHeader';
import { Badge } from '../components/ui/badge';
import useCart from '../hooks/useCart';

const PublicCatalog: React.FC = () => {
  const { t } = useTranslation();
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMain, setStatusMain] = useState<string>('online');
  const [statusCustom, setStatusCustom] = useState<string>('');
  const { getTotalItems } = useCart();

  useEffect(() => {
    if (catalogId) {
      loadCatalog();
    }
  }, [catalogId]);

  // Poll for status updates every 30 seconds
  useEffect(() => {
    if (!catalogId) return;

    const interval = setInterval(() => {
      loadCatalog();
    }, 120000); // 120 seconds

    return () => clearInterval(interval);
  }, [catalogId]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await catalogAPI.getPublicCatalog(catalogId!);
      if (response.success && response.data) {
        setCatalog(response.data);
        // Update status state for consistency
        if (response.data.owner) {
          setStatusMain(response.data.owner.statusMain || 'online');
          setStatusCustom(response.data.owner.statusCustom || '');
        }
      } else {
        setError(response.message || 'Failed to load catalog');
      }
    } catch (error) {
      console.error('Failed to load public catalog:', error);
      setError('Failed to load catalog. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Cart is now managed by useCart hook - no need for separate cart loading

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loadingStates.loadingCatalog')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">{t('common.error')}</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">{t('common.error')}</h2>
        <p className="text-muted-foreground">{t('common.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-6 lg:px-8">
      {/* Catalog Header with Store Cover Image */}
      <ProfileHeader
        name={catalog.name}
        username={catalog.owner?.username}
        avatar={catalog.owner?.avatar}
        coverImage={catalog.owner?.image}
        statusMain={statusMain}
        statusCustom={statusCustom}
        subtitle={catalog.owner?.name || t('common.store')}
        isStore={true}
      />

      {/* Catalog Description */}
      {catalog.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{catalog.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Cart Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={() => navigate('/cart')}
          className="relative bg-primary hover:bg-primary/90 font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          size="lg"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {t("common.cart")}
          {getTotalItems() > 0 && (
            <Badge
              className="absolute -top-2 -right-2 bg-constructive text-xs font-bold px-2 py-1 rounded-full animate-pulse"
              variant="destructive"
            >
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Menu Grid */}
      <StoreMenu storeId={catalog.owner?._id} catalogId={catalog._id}/>

      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.storeInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{t("common.storeName")}</span>
            <span>{catalog.owner?.name || 'Unknown Store'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{t("common.userName")}</span>
            <span className="text-primary">@{catalog.owner?.username}</span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default PublicCatalog;