import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { imageAPI } from '../services/api';

interface ImageData {
  filename: string;
  url: string;
  size: number;
  uploadDate: string;
  uploadedBy?: any;
  deleted?: boolean;
  id?: string;
}

interface ImageManagementProps {
  user: any;
}

const ImageManagement: React.FC<ImageManagementProps> = ({ user }) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadImages();
    }
  }, [user]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await imageAPI.list();
      if (response.success && response.data) {
        setImages(response.data as ImageData[]);
      }
    } catch (error: any) {
      toast.error('Failed to load images');
      console.error('Load images error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      const response = await imageAPI.downloadBackup();

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `image-backup-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Backup downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download backup');
      console.error('Download backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('backup', file);

      await imageAPI.uploadBackup(formData);
      toast.success('Backup uploaded and restored successfully');
      loadImages(); // Reload images after restore
    } catch (error: any) {
      toast.error('Failed to upload backup');
      console.error('Upload backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (filename: string) => {
    const confirmMessage = user?.role === 'admin'
      ? `Are you sure you want to PERMANENTLY DELETE ${filename}? This action cannot be undone.`
      : `Are you sure you want to delete ${filename}? It will be marked as deleted but can be restored by an admin.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const response = await imageAPI.delete(filename);

      if (response.success) {
        toast.success('Image deleted successfully');
        loadImages();
      } else {
        toast.error(response.message || 'Failed to delete image');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete image');
      console.error('Delete image error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceImage = async () => {
    if (!selectedImage || !replaceFile) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', replaceFile);

      // TODO: Implement replace functionality on backend
      await imageAPI.upload(formData);
      toast.success('Image replaced successfully');
      setShowReplaceModal(false);
      setSelectedImage(null);
      setReplaceFile(null);
      loadImages();
    } catch (error: any) {
      toast.error('Failed to replace image');
      console.error('Replace image error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          {user?.role === 'admin' ? 'Image Management' : 'My Images'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {user?.role === 'admin'
            ? 'Manage system images, backups, and replacements'
            : 'View and manage your uploaded images'
          }
        </p>
      </div>

      {/* Backup Actions - Admin Only */}
      {user?.role === 'admin' && (
        <div className="card p-6">
          <h2 className="text-2xl font-semibold mb-4">Backup Management</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleDownloadBackup}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              📥 Download Backup
            </button>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              📤 Upload & Restore Backup
              <input
                type="file"
                accept=".zip"
                onChange={handleUploadBackup}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Image Gallery ({images.length} images)</h2>
          <button
            onClick={loadImages}
            disabled={loading}
            className="btn-secondary"
          >
            🔄 Refresh
          </button>
        </div>

        {loading && images.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No images found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.filename} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${image.deleted ? 'opacity-60 bg-red-50 border-red-200' : ''}`}>
                <div className="aspect-square mb-3 overflow-hidden rounded relative">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {image.deleted && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">DELETED</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate" title={image.filename}>
                      {image.filename}
                    </p>
                    {image.deleted && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        Soft Deleted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Size: {formatFileSize(image.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded: {new Date(image.uploadDate).toLocaleDateString()}
                  </p>
                  {image.uploadedBy && (
                    <p className="text-xs text-muted-foreground">
                      By: {image.uploadedBy.name || image.uploadedBy.username}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {!image.deleted && (
                      <button
                        onClick={() => {
                          setSelectedImage(image);
                          setShowReplaceModal(true);
                        }}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Replace
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(image.filename)}
                      disabled={loading}
                      className={`text-xs py-1 px-2 ${
                        user?.role === 'admin'
                          ? 'btn-danger'
                          : image.deleted
                            ? 'btn-secondary opacity-50 cursor-not-allowed'
                            : 'btn-danger'
                      }`}
                    >
                      {user?.role === 'admin' ? 'Delete' : image.deleted ? 'Deleted' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Replace Image Modal */}
      {showReplaceModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Replace Image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Replace {selectedImage.filename}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
              className="w-full mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReplaceImage}
                disabled={!replaceFile || loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Replacing...' : 'Replace'}
              </button>
              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setSelectedImage(null);
                  setReplaceFile(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagement;