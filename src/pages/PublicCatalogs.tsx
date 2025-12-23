import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogAPI } from '../services/api';
import { formatPersianDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, ShoppingBag, Store } from 'lucide-react';

const PublicCatalogs: React.FC = () => {
  const { t } = useTranslation();
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await catalogAPI.getPublicCatalogs();
      if (response.success && response.data) {
        setCatalogs(response.data);
      } else {
        setError(response.message || 'Failed to load catalogs');
      }
    } catch (error) {
      console.error('Failed to load catalogs:', error);
      setError('Failed to load catalogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCatalog = (catalogId: string) => {
    navigate(`/catalog/public/${catalogId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loadingStates.loadingCatalogs')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">{t('common.error')}</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadCatalogs} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-4">{t('common.publicCatalogs')}</h1>
        <p className="text-muted-foreground">
          {t('page.catalogs.browseAndShop')}
        </p>
      </div>

      {/* Catalogs Grid */}
      {catalogs.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{t('common.noCatalogsAvailable')}</h3>
          <p className="text-muted-foreground">
            {t('common.noPublicCatalogsAvailable')}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalogs.map((catalog) => (
            <Card key={catalog._id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="aspect-square bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 rounded-lg mb-3 flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-lg line-clamp-2">{catalog.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {catalog.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {catalog.description}
                  </p>
                )}

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>{catalog.owner?.name || 'Store'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {catalog.products?.length || 0} {t('common.products')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatPersianDate(catalog.createdAt, 'short')}
                  </span>
                </div>

                <Button
                  onClick={() => handleViewCatalog(catalog._id)}
                  className="w-full group-hover:bg-primary/90 transition-colors"
                >
                  {t('page.catalogs.viewCatalog')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicCatalogs;