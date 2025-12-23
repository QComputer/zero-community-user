import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { categoryAPI, imageAPI } from '../services/api';
import { logUserAction } from '../services/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClickOutside } from '@/hooks/useClickOutside';
import { X, Upload, Plus } from 'lucide-react';

interface AddCategoryCardProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface CategoryFormData {
  name: string;
  description: string;
  image: File | null;
  isGlobal: boolean;
}

const AddCategoryCard: React.FC<AddCategoryCardProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image: null,
    isGlobal: false,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Click outside ref to close modal
  const modalRef = useClickOutside<HTMLDivElement>(() => onClose(), [onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

        if (backendResponse.success) {
          imageUrl = (backendResponse.data as any).url;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('isGlobal', formData.isGlobal.toString());

      if (imageUrl) {
        submitData.append('image', imageUrl);
      }

      await categoryAPI.add(submitData);

      toast.success('Category added successfully!');
      logUserAction('add_category', { categoryName: formData.name, store: user._id });
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Add category error:', error);
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Failed to add category. Please check your connection and try again.';
      toast.error(errorMessage);
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
            <Plus className="h-5 w-5" />
            Add New Category
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

              {/* Global Category Option - Only for Admins */}
              {user.role === 'admin' && (
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
                    id="category-image-upload"
                  />
                  <label
                    htmlFor="category-image-upload"
                    className="inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium cursor-pointer"
                  >
                    Choose Image
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || loading}>
                {loading ? 'Adding Category...' : 'Add Category'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCategoryCard;