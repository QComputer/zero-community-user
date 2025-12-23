import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { catalogAPI, productAPI } from '../services/api';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const CreateCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
  }, []);

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
        frontendUrl: window.location.origin,
        design: useCustomDesign && designId ? { designId } : {
          layout: {
            type: layoutType,
            columns: parseInt(columns.toString())
          }
        }
      };

      await catalogAPI.create(catalogData);
      toast.success('Catalog created successfully');
      navigate('/catalogs');
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/catalogs')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalogs
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Catalog</h1>
        <p className="text-muted-foreground">
          Create a new catalog to showcase your products
        </p>
      </div>

      <Card>
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
                              {product.currency === 'USD' ? '$' : ''}{Number(product.price).toFixed(2)}{product.currency === 'IRT' ? ' IRT' : ''}
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
          <Button variant="outline" onClick={() => navigate('/catalogs')} disabled={saving}>
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

export default CreateCatalog;