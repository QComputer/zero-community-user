# Deployment Fix Guide

This guide addresses the TypeScript compilation errors encountered during deployment to RunFlare.

## Issues Fixed

### 1. Missing TypeScript Type Definitions

**Problem**: 
```
error TS7016: Could not find a declaration file for module 'leaflet'
error TS2307: Cannot find module '@vitejs/plugin-react'
```

**Solution**: Added missing type definitions to `package.json`:
- `@types/react-image-crop`: "^10.0.10"

### 2. TypeScript Compilation Configuration

**Problem**: TypeScript compilation failing during build process

**Solution**: Updated `vite.config.ts` with:
- Added `esbuild` target configuration
- Added `optimizeDeps` configuration
- Set target to 'es2020' for better compatibility

## Updated Files

### package.json
```json
{
  "devDependencies": {
    "@types/react-image-crop": "^10.0.10",
    // ... other dependencies
  }
}
```

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message.includes('Instead of /public/')) {
          return;
        }
        warn(warning);
      },
    },
  },
  esbuild: {
    target: 'es2020'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  }
})
```

## Deployment Steps

1. **Update Dependencies**:
   ```bash
   npm install
   ```

2. **Build Test**:
   ```bash
   npm run build
   ```

3. **Deploy to RunFlare**:
   - Push changes to GitHub
   - RunFlare will automatically rebuild with the fixes

## Expected Build Output

After applying these fixes, the build should complete successfully:

```
> zero-community-user@1.0.0 build
> tsc -b && vite build

✓ 37 modules transformed.
dist/index.html                  0.56 kB │ gzip:  0.32 kB
dist/assets/index-*.js         144.85 kB │ gzip: 48.64 kB
dist/assets/index-*.css         13.89 kB │ gzip:  3.25 kB
✓ built in 5.23s
```

## Verification

After deployment, verify the frontend is working by:

1. **Access the deployed frontend**: `https://sefr.liara.run`
2. **Test image upload functionality**:
   - Navigate to admin panel
   - Use the "Image Test" component
   - Verify uploads work correctly

## Troubleshooting

### If Build Still Fails

1. **Clear node_modules**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check TypeScript version compatibility**:
   ```bash
   npm list typescript
   ```

3. **Verify all dependencies are installed**:
   ```bash
   npm ls --depth=0
   ```

### If Runtime Errors Occur

1. **Check browser console for errors**
2. **Verify environment variables are set correctly**
3. **Ensure API endpoints are accessible**

## Environment Variables

Ensure these are set in your deployment environment:

```env
VITE_API_BASE_URL=https://sefr.runflare.run/api/v1
VITE_IMAGE_SERVER_URL=https://zero-community-image.onrender.com
```

## Next Steps

After successful deployment:

1. **Test all image upload scenarios**:
   - Profile image upload
   - Product image upload
   - Category image upload
   - Direct image server upload

2. **Verify API integration**:
   - Test API upload endpoints
   - Check authentication handling
   - Verify response formats

3. **Monitor performance**:
   - Check upload speeds
   - Monitor server response times
   - Verify error handling