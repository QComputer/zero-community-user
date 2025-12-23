import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { catalogAPI, productAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Save, Loader2 } from 'lucide-react';

interface CreateCatalogCardProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCatalogCard: React.FC<CreateCatalogCardProps> = ({ user, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const [layoutType, setLayoutType] = useState('grid');
  const [columns, setColumns] = useState(3);
  const [designId, setDesignId] = useState<string>('');
  const [availableDesigns, setAvailableDesigns] = useState<any[]>([]);
  const [useCustomDesign, setUseCustomDesign] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsResponse, designsResponse] = await Promise.all([
          productAPI.getList(),
          catalogAPI.getCatalogDesigns()
        ]);
        setAvailableProducts(productsResponse.data || []);
        setAvailableDesigns(designsResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user._id]);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Catalog name is required');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    try {
      setSaving(true);
      const catalogData = {
        name,
        description,
        productIds: selectedProducts,
        isPublic,
        frontendUrl: window.location.origin, // Use frontend URL for share links
        design: useCustomDesign && designId ? { designId } : {
          layout: {
            type: layoutType,
            columns: parseInt(columns.toString())
          }
        }
      };

      await catalogAPI.create(catalogData);
      toast.success('Catalog created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create catalog:', error);
      toast.error('Failed to create catalog');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Create New Catalog</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Catalog Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter catalog name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter catalog description"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label htmlFor="isPublic">Make this catalog public</Label>
              </div>

              {isPublic && (
                <p className="text-sm text-muted-foreground">
                  Public catalogs can be accessed by anyone with the shareable link.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCustomDesign"
                  checked={useCustomDesign}
                  onCheckedChange={(checked) => setUseCustomDesign(checked as boolean)}
                />
                <Label htmlFor="useCustomDesign">Use custom design template</Label>
              </div>

              {useCustomDesign && (
                <div className="space-y-2">
                  <Label htmlFor="design">Select Design Template</Label>
                  <Select value={designId} onValueChange={setDesignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a design template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDesigns.map(design => (
                        <SelectItem key={design._id} value={design._id}>{design.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!useCustomDesign && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="layout">Layout Type</Label>
                    <Select value={layoutType} onValueChange={setLayoutType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="columns">Columns (for Grid/Masonry)</Label>
                    <Select value={columns.toString()} onValueChange={(value) => setColumns(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select columns" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Select Products</h3>

              <div className="space-y-2">
                <Label htmlFor="productSearch">Search Products</Label>
                <Input
                  id="productSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground">No products found</p>
                  ) : (
                    filteredProducts.map(product => (
                      <div key={product._id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedProducts.includes(product._id)}
                            onCheckedChange={() => handleProductToggle(product._id)}
                            id={`product-${product._id}`}
                          />
                          <Label htmlFor={`product-${product._id}`} className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.currency === 'USD' ? '$' : ''}{Number(product.price).toFixed(2)}{product.currency === 'IRT' ? ` ${t('common.iranToman')}` : ''}
                            </div>
                          </Label>
                        </div>
                        <div className="text-sm">
                          {product.available ? (
                            <span className="text-green-600">Available</span>
                          ) : (
                            <span className="text-red-600">Out of stock</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving || !name.trim() || selectedProducts.length === 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Catalog
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateCatalogCard;