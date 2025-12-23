import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { catalogAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Eye, Copy, Share2 } from 'lucide-react';

const Catalogs: React.FC = () => {
  const { t } = useTranslation();
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedShare, setExpandedShare] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await catalogAPI.getCatalogs();
      if (response.success && response.data) {
        setCatalogs(response.data);
      } else {
        setError(response.message || 'Failed to load catalogs');
      }
    } catch (error) {
      console.error('Failed to load catalogs:', error);
      setError(t('page.catalogs.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCatalog = () => {
    navigate('/catalogs/create'); // Assuming there's a create route
  };

  const handleEditCatalog = (catalogId: string) => {
    navigate(`/catalogs/edit/${catalogId}`); // Assuming there's an edit route
  };

  const handleDeleteCatalog = async (catalogId: string) => {
    if (!confirm(t('page.catalogs.confirmDelete'))) return;

    try {
      await catalogAPI.delete(catalogId);
      toast.success(t('page.catalogs.deleteSuccess'));
      loadCatalogs();
    } catch (error) {
      toast.error(t('page.catalogs.deleteError'));
    }
  };

  const handleDuplicateCatalog = async (catalogId: string) => {
    try {
      await catalogAPI.duplicate(catalogId);
      toast.success(t('page.catalogs.duplicateSuccess'));
      loadCatalogs();
    } catch (error) {
      toast.error(t('page.catalogs.duplicateError'));
    }
  };

  const handleViewCatalog = (catalogId: string) => {
    navigate(`/catalog/public/${catalogId}`);
  };

  const copyShareLink = async (catalog: any) => {
    if (catalog?.shareLink) {
      try {
        await navigator.clipboard.writeText(catalog.shareLink);
        setCopySuccess(catalog._id);
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
        toast.error(t('common.failedToCopyLink'));
      }
    }
  };

  const toggleShareSection = (catalogId: string) => {
    setExpandedShare(expandedShare === catalogId ? null : catalogId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('page.catalogs.loadingCatalogs')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">{t('page.catalogs.errorLoadingCatalogs')}</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadCatalogs} className="mt-4">
          {t('page.catalogs.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.catalogs.title')}</h1>
          <p className="text-muted-foreground">
            {t('page.catalogs.subtitle')}
          </p>
        </div>
        <Button onClick={handleCreateCatalog}>
          <Plus className="h-4 w-4 mr-2" />
          {t('page.catalogs.createCatalog')}
        </Button>
      </div>

      {/* Catalogs Grid */}
      {catalogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">{t('page.catalogs.noCatalogsYet')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('page.catalogs.noCatalogsDescription')}
          </p>
          <Button onClick={handleCreateCatalog}>
            <Plus className="h-4 w-4 mr-2" />
            {t('page.catalogs.createFirstCatalog')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {catalogs.map((catalog) => (
            <Card key={catalog._id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{catalog.name}</CardTitle>
                  <Badge variant={catalog.isPublic ? "default" : "secondary"}>
                    {catalog.isPublic ? t('page.catalogs.public') : t('page.catalogs.private')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {catalog.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {catalog.description}
                  </p>
                )}

                <div className="text-sm text-muted-foreground">
                  {catalog.products?.length || 0} {t('page.catalogs.products')}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewCatalog(catalog._id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('page.catalogs.view')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditCatalog(catalog._id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t('page.catalogs.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateCatalog(catalog._id)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {t('page.catalogs.duplicate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCatalog(catalog._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('page.catalogs.delete')}
                  </Button>
                </div>

                {/* Share Section for Public Catalogs */}
                {catalog.isPublic && (
                  <div className="space-y-3 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleShareSection(catalog._id)}
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      {t('common.share')}
                    </Button>
                    
                    {expandedShare === catalog._id && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                        {/* Share Link */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium">{t('common.share')}</label>
                          <div className="flex items-center gap-2 p-2 bg-background rounded border">
                            <input
                              type="text"
                              value={catalog?.shareLink || ''}
                              readOnly
                              className="flex-1 bg-transparent border-none outline-none text-xs"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyShareLink(catalog)}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                              {copySuccess === catalog._id ? t('common.copied') : t('common.copy')}
                            </Button>
                          </div>
                        </div>

                        {/* QR Code */}
                        {catalog?.qrCode && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium">{t('page.account.qrCode')}</label>
                            <div className="flex justify-center p-2 bg-white rounded border">
                              <img
                                src={catalog.qrCode}
                                alt="QR Code"
                                className="w-20 h-20"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              {t('page.catalogs.scanToAccess')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalogs;