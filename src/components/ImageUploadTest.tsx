import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { imageAPI, API_BASE_URL, IMAGE_SERVER_URL } from '../services/api';

interface ImageUploadTestProps {
  user: any;
}
const ImageUploadTest: React.FC<ImageUploadTestProps> = ({ user }) => {
  const [uploading, setUploading] = useState(false);
  const [testImage, setTestImage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setTestImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const testImageUpload = async () => {
    if (!testImage) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      // Create a test image file
      const response = await fetch(testImage);
      const blob = await response.blob();
      const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);

      console.log('Testing image upload to:', process.env.VITE_API_BASE_URL);
      console.log('Image server URL:', process.env.VITE_IMAGE_SERVER_URL);

      const result = await imageAPI.directUpload(formData);
      
      setUploadResult(result);
      toast.success('Image upload test successful!');
      console.log('Upload result:', result);
    } catch (error: any) {
      console.error('Image upload test failed:', error);
      setUploadResult({ error: error.message || 'Upload failed' });
      toast.error(`Image upload test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const testImageServerDirectly = async () => {
    if (!testImage) {
      toast.error('Please select an image first');
      return;
    }
    const imageServerUrl = process.env.VITE_IMAGE_SERVER_URL
    if (!imageServerUrl) {
      toast.error('No imageServerUrl found. Please insert VITE_IMAGE_SERVER_URL to .env file');
      return;
    }
    setUploading(true);

    try {
      // Test direct upload to image server
      const response = await fetch(testImage);
      const blob = await response.blob();
      const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);

      console.log('Testing direct upload to image server:', imageServerUrl);

      //const result = imageAPI.directUpload(formData);

      const result = await fetch(`${imageServerUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await result.json();
      console.log('Direct upload result:', data);
      
      if (result.ok) {
        toast.success('Direct image server test successful!');
        setUploadResult({ directTest: true, result: data });
      } else {
        toast.error(`Direct image server test failed: ${data.message || 'Unknown error'}`);
        setUploadResult({ directTest: true, error: data.message || 'Upload failed' });
      }
    } catch (error: any) {
      console.error('Direct image server test failed:', error);
      toast.error(`Direct image server test failed: ${error.message || 'Unknown error'}`);
      setUploadResult({ directTest: true, error: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Image Upload Test
        </h1>
        <p className="text-muted-foreground">
          Test image uploading functionality to verify the deployed services are working
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>API Base URL:</strong>
            <p className="text-sm text-muted-foreground">{API_BASE_URL}</p>
          </div>
          <div>
            <strong>Image Server URL:</strong>
            <p className="text-sm text-muted-foreground">{IMAGE_SERVER_URL}</p>
          </div>
          <div>
            <strong>User Role:</strong>
            <p className="text-sm text-muted-foreground">{user?.role || 'Not authenticated'}</p>
          </div>
          <div>
            <strong>Authentication:</strong>
            <p className="text-sm text-muted-foreground">
              {localStorage.getItem('token') ? 'Authenticated' : 'Not authenticated'}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test Image Upload</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Test Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {testImage && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Image Preview
              </label>
              <img
                src={testImage}
                alt="Test preview"
                className="max-w-md max-h-64 object-cover rounded-lg border"
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={testImageUpload}
              disabled={uploading || !testImage}
              className="btn-primary flex items-center gap-2"
            >
              {uploading ? 'Testing...' : 'Test API Upload'}
            </button>
            
            <button
              onClick={testImageServerDirectly}
              disabled={uploading || !testImage}
              className="btn-secondary flex items-center gap-2"
            >
              {uploading ? 'Testing...' : 'Test Direct Upload'}
            </button>
          </div>
        </div>
      </div>

      {uploadResult && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-4">
            {uploadResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-600 font-semibold">Test Failed</h3>
                <p className="text-red-600 text-sm">{uploadResult.error}</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-600 font-semibold">Test Successful</h3>
                <pre className="text-sm text-green-600 mt-2 overflow-auto">
                  {JSON.stringify(uploadResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadTest;