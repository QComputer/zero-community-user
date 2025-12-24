# Image Upload Testing Guide

This guide explains how to test the image upload functionality for the Zero Community User frontend.

## Overview

The image upload functionality has been deployed on:
- **Backend API**: `https://sefr.runflare.run`
- **Image Server**: `https://zero-community-image.onrender.com`
- **Frontend**: `https://sefr.liara.run`

## Testing Methods

### 1. Using the Image Upload Test Component (Recommended)

1. **Access the Test Component**:
   - Log in as an admin user
   - Navigate to the navigation menu
   - Click on "Image Test" (only visible to admin users)

2. **Test Features**:
   - Upload a test image through the API
   - Test direct upload to the image server
   - View environment configuration
   - See detailed test results

3. **What Gets Tested**:
   - API upload endpoint (`/image/upload`)
   - Direct image server upload
   - Authentication handling
   - Response format validation

### 2. Using Browser Console

Open the browser console and run:

```javascript
// Run all tests
await imageUploadTester.runAllTests();

// Test specific functionality
await imageUploadTester.testApiServerHealth();
await imageUploadTester.testImageServerHealth();
await imageUploadTester.testApiUpload();
await imageUploadTester.testDirectUpload();
```

### 3. Manual Testing

1. **Test Profile Image Upload**:
   - Go to Account Settings
   - Try uploading a profile picture
   - Verify the image appears correctly

2. **Test Product Image Upload**:
   - Go to Products page (store users)
   - Try adding a new product with an image
   - Verify the image uploads successfully

3. **Test Category Image Upload**:
   - Go to Categories page (store users)
   - Try adding a new category with an image
   - Verify the image uploads successfully

## Expected Results

### Successful Tests Should Show:
- ✅ API server is healthy
- ✅ Image server is healthy
- ✅ API upload test successful
- ✅ Direct upload test successful

### Response Format:
```json
{
  "success": true,
  "message": "Upload successful",
  "data": {
    "url": "https://zero-community-image.onrender.com/uploads/filename.jpg",
    "filename": "filename.jpg",
    "size": 12345,
    "uploadDate": "2025-12-23T22:00:00.000Z"
  }
}
```

## Troubleshooting

### Common Issues:

1. **Authentication Errors**:
   - Ensure you're logged in
   - Check if the token is valid
   - Verify the token is being sent in requests

2. **CORS Errors**:
   - Check if the image server allows cross-origin requests
   - Verify the server is running and accessible

3. **Network Errors**:
   - Check internet connection
   - Verify the server URLs are correct
   - Check if the servers are online

4. **File Type Errors**:
   - Ensure you're uploading supported image formats (PNG, JPG)
   - Check file size limits (typically 10MB)

### Debug Information:

The test component displays:
- Current API base URL
- Current image server URL
- User role and authentication status
- Detailed error messages
- Full response data

## Environment Variables

Ensure these are set correctly in `.env`:

```env
VITE_API_BASE_URL=https://sefr.runflare.run/api/v1
VITE_IMAGE_SERVER_URL=https://zero-community-image.onrender.com
```

## Server Endpoints

### API Endpoints:
- `POST /api/v1/image/upload` - Upload image through API
- `GET /api/v1/image/list` - List images (admin only)
- `DELETE /api/v1/image/{filename}` - Delete image

### Image Server Endpoints:
- `POST /upload` - Direct image upload
- `GET /health` - Health check
- `GET /{filename}` - View image

## Notes

- The image upload test component is only visible to admin users
- Direct image server upload doesn't require authentication
- API upload requires a valid user token
- Test images are automatically cleaned up by the server
- All uploads are processed through the deployed image server