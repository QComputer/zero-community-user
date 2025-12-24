/**
 * Image Upload Test Utility
 * Tests image uploading functionality to verify deployed services are working
 */

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export class ImageUploadTester {
  private apiBaseUrl: string;
  private imageServerUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sefr.runflare.run/api/v1';
    this.imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 'https://zero-community-image.onrender.com';
  }

  /**
   * Test API upload endpoint
   */
  async testApiUpload(): Promise<TestResult> {
    try {
      // Create a test image (1x1 pixel PNG)
      const testImage = this.createTestImage();
      const formData = new FormData();
      formData.append('image', testImage, 'test-image.png');

      const response = await fetch(`${this.apiBaseUrl}/image/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'token': localStorage.getItem('token') || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'API upload test successful',
          data
        };
      } else {
        return {
          success: false,
          message: 'API upload test failed',
          error: data.message || 'Upload failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'API upload test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test direct image server upload
   */
  async testDirectUpload(): Promise<TestResult> {
    try {
      // Create a test image (1x1 pixel PNG)
      const testImage = this.createTestImage();
      const formData = new FormData();
      formData.append('image', testImage, 'test-image.png');

      const response = await fetch(`${this.imageServerUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Direct upload test successful',
          data
        };
      } else {
        return {
          success: false,
          message: 'Direct upload test failed',
          error: data.message || 'Upload failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Direct upload test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test image server health
   */
  async testImageServerHealth(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.imageServerUrl}/health`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Image server is healthy',
          data
        };
      } else {
        return {
          success: false,
          message: 'Image server health check failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Image server health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test API server health
   */
  async testApiServerHealth(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'API server is healthy',
          data
        };
      } else {
        return {
          success: false,
          message: 'API server health check failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'API server health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting image upload tests...');
    console.log(`API Base URL: ${this.apiBaseUrl}`);
    console.log(`Image Server URL: ${this.imageServerUrl}`);
    console.log(`Authenticated: ${!!localStorage.getItem('token')}`);

    const results: TestResult[] = [];

    // Test 1: API Server Health
    console.log('\n1. Testing API server health...');
    const apiHealth = await this.testApiServerHealth();
    results.push(apiHealth);
    console.log(apiHealth.success ? '✅' : '❌', apiHealth.message);

    // Test 2: Image Server Health
    console.log('\n2. Testing image server health...');
    const imageHealth = await this.testImageServerHealth();
    results.push(imageHealth);
    console.log(imageHealth.success ? '✅' : '❌', imageHealth.message);

    // Test 3: API Upload (requires authentication)
    if (localStorage.getItem('token')) {
      console.log('\n3. Testing API upload...');
      const apiUpload = await this.testApiUpload();
      results.push(apiUpload);
      console.log(apiUpload.success ? '✅' : '❌', apiUpload.message);
    } else {
      console.log('\n3. Skipping API upload test (not authenticated)');
      results.push({
        success: false,
        message: 'API upload test skipped (not authenticated)'
      });
    }

    // Test 4: Direct Upload
    console.log('\n4. Testing direct upload...');
    const directUpload = await this.testDirectUpload();
    results.push(directUpload);
    console.log(directUpload.success ? '✅' : '❌', directUpload.message);

    console.log('\n📊 Test Results Summary:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.success ? '✅' : '❌'} ${result.message}`);
    });

    return results;
  }

  /**
   * Create a minimal test image (1x1 pixel PNG)
   */
  private createTestImage(): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 1, 1);
    }
    
    // Create a simple PNG blob manually since toBlob returns void
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR chunk type
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // Color type, compression, filter, interlace
      0x00, 0x00, 0x00, 0x01, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT chunk type
      0x08, // Compressed data
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND chunk type
      0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ]);
    
    return new Blob([pngHeader], { type: 'image/png' });
  }
}

// Export a singleton instance
export const imageUploadTester = new ImageUploadTester();

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).imageUploadTester = imageUploadTester;
}