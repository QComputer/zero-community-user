import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { productAPI, categoryAPI, imageAPI } from '../services/api';
import { logUserAction } from '../services/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClickOutside } from '@/hooks/useClickOutside';
import { X, Upload, Plus } from 'lucide-react';
import { compressImageWithToast } from '../utils/imageCompression';

interface AddProductCardProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
  stores?: any[]; // For admins to select which store to add product for
}

interface ProductFormData {
  name: string;
  store: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  image: File | null;
  available: boolean;
  stock: string;
  tags: string;
  brand: string;
  sku: string;
  barcode: string;
  weight: string;
  dimensions: string;
  label: string;
}

const AddProductCard: React.FC<AddProductCardProps> = ({
  user,
  onClose,
  onSuccess,
  //stores = []
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    store: '',
    description: '',
    price: '',
    currency: 'IRT',
    category: '',
    image: null,
    available: true,
    stock: '',
    tags: '',
    brand: '',
    sku: '',
    barcode: '',
    weight: '',
    dimensions: '',
    label: ''
  });

  const [selectedStore, setSelectedStore] = useState(user.role === 'admin' ? '' : user._id);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Click outside ref to close modal
  const modalRef = useClickOutside<HTMLDivElement>(() => onClose(), [onClose]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories for user:', user._id, 'role:', user.role);
        const response = await categoryAPI.list();
        console.log('Category API response:', response);
        const categoryList = response.data || [];
        console.log('Category list received:', categoryList.length, 'items');
        // Include both user's own categories and global categories
        const allCategories = categoryList
          .filter((cat: any) => cat.isGlobal || cat.store?._id === user._id)
          .map((cat: any) => cat.name);
        console.log('Filtered categories:', allCategories);
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to empty array if API fails
        setCategories([]);
      }
    };
    loadCategories();
  }, [user._id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress the image before setting it in the form data
      const compressedFile = await compressImageWithToast(file, 500);
      if (compressedFile) {
        setFormData(prev => ({ ...prev, image: compressedFile }));
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image to backend if present
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.image);

        const backendResponse = await imageAPI.upload(imageFormData);

        if (backendResponse.success) {
          imageUrl = (backendResponse.data as any).url;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('currency', formData.currency);
      submitData.append('category', formData.category);
      submitData.append('available', formData.available.toString());
      submitData.append('stock', formData.stock);
      submitData.append('tags', formData.tags);
      submitData.append('brand', formData.brand);
      submitData.append('sku', formData.sku);
      submitData.append('barcode', formData.barcode);
      submitData.append('weight', formData.weight);
      submitData.append('dimensions', formData.dimensions);
      submitData.append('label', formData.label);

      if (imageUrl) {
        submitData.append('image', imageUrl);
      }

      // For admins, use selected store, for stores use their own ID
      const storeId = user.role === 'admin' ? selectedStore : user._id;
      submitData.append('userId', storeId);

      await productAPI.add(submitData);

      toast.success('Product added successfully!');
      logUserAction('add_product', { productName: formData.name, userId: user._id });
      onSuccess();
      onClose();

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.price && formData.category && (user.role !== 'admin' || selectedStore);

  return (
    <div ref={modalRef} className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card-classic">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('components.addProductCard.title')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Marketer Selection - Only for Admins */}
            {user.role === 'admin' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.selectStore')} *
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                </select>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.productName')} *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.category')} *
                </label>
                <div className="flex gap-2">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map((category, index) => (
                      <option key={`${category}-${index}`} value={category}>{category}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={async () => {
                      const newCategoryName = prompt('Enter new category name:');
                      if (newCategoryName && newCategoryName.trim()) {
                        try {
                          // Add the new category
                          const formData = new FormData();
                          formData.append('name', newCategoryName.trim());
                          formData.append('description', '');
                          await categoryAPI.add(formData);

                          // Refresh categories
                          setCategories(prev => [...prev, newCategoryName.trim()]);
                          setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));

                          toast.success(`Category "${newCategoryName.trim()}" created!`);
                          logUserAction('add_category_inline', { categoryName: newCategoryName.trim(), userId: user._id });
                        } catch (error) {
                          toast.error('Failed to create category');
                          console.error('Error creating category:', error);
                        }
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('components.addProductCard.description')}
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product..."
                rows={3}
              />
            </div>

            {/* Pricing and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.price')} *
                </label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.currency')} *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="IRT">IRT (Iran Toman)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.stock')}
                </label>
                <Input
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.label')}
                </label>
                <Input
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="e.g., New, Popular"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('components.addProductCard.image')}
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium cursor-pointer"
                  >
                    {t('components.addProductCard.chooseImage')}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('components.addProductCard.imageNote')}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.brand')}
                </label>
                <Input
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Brand name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.tags')}
                </label>
                <Input
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="organic, fresh, handmade"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.sku')}
                </label>
                <Input
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Stock Keeping Unit"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.barcode')}
                </label>
                <Input
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="Barcode number"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.weight')}
                </label>
                <Input
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 500g"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('components.addProductCard.dimensions')}
                </label>
                <Input
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="L x W x H"
                />
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available"
                name="available"
                checked={formData.available}
                onChange={handleInputChange}
                className="rounded"
              />
              <label htmlFor="available" className="text-sm font-medium">
                {t('components.addProductCard.available')}
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('components.addProductCard.cancel')}
              </Button>
              <Button type="submit" disabled={!isFormValid || loading}>
                {loading ? t('components.addProductCard.addingProduct') : t('components.addProductCard.addProduct')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductCard;