import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { categoryAPI, imageAPI } from '../services/api';
import { logUserAction } from '../services/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClickOutside } from '@/hooks/useClickOutside';
import { X, Upload, Edit, Trash2 } from 'lucide-react';

interface EditCategoryCardProps {
  user: any;
  category: any;
  onClose: () => void;
  onSuccess: () => void;
}
interface CategoryFormData {
  id: string;
  name: string;
  description: string;
  image: File | null;
  isGlobal: boolean;
  store: string;
}
const EditCategoryCard: React.FC<EditCategoryCardProps> = ({
  user,
  category,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category.name || '',
    id: category._id || '',
    description: category.description || '',
    image: null,
    isGlobal: category.isGlobal,
    store: category.store || '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(category?.image || null);
  const [loading, setLoading] = useState(false);

  // Click outside ref to close modal
  const modalRef = useClickOutside<HTMLDivElement>(() => onClose(), [onClose]);

  useEffect(() => {
    if (category) {
      setFormData(category);
      setImagePreview(category.image || null);
    }
  }, [category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

        if (backendResponse.success && (backendResponse.data as any).url) {
          imageUrl = (backendResponse.data as any).url;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Create FormData for the backend (consistent with add operation)
      const submitData = new FormData();
      submitData.append('id', formData.id);
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('isGlobal', formData.isGlobal.toString());

      if (imageUrl) {
        submitData.append('image', imageUrl);
      }

      // Use the category ID directly
      const categoryId = category._id;
      if (!categoryId) {
        throw new Error('Category ID is missing');
      }
      await categoryAPI.update(categoryId, submitData);

      toast.success('Category updated successfully!');
      logUserAction('edit_category', { categoryId: category._id, categoryName: formData.name, store: formData.store });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Update category error:', error);
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Failed to update category. Please check your connection and try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      await categoryAPI.remove(category._id);

      toast.success('Category deleted successfully!');
      logUserAction('delete_category', { categoryId: category._id, categoryName: category.name, store: user.name });
      onSuccess();
      onClose();

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim().length > 0;

  return (
    <div ref={modalRef} className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card-classic">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Category
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Category Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your category..."
                  rows={3}
                />
              </div>

              {/* isGlobal and Store Category options - Only for Admins */}
              {user.role === 'admin' && (
                <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isGlobal" className="text-sm font-medium text-muted-foreground">
                    Make this a global category (visible to all stores)
                  </label>


                </div>
                  </>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Category Image
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
                    id="category-image-edit"
                  />
                  <label
                    htmlFor="category-image-edit"
                    className="inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium cursor-pointer"
                  >
                    Change Image
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Category
              </Button>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isFormValid || loading}>
                  {loading ? 'Updating Category...' : 'Update Category'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCategoryCard;
