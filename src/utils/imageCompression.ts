import { toast } from 'react-toastify';

/**
 * Compress an image to a target size (default: 500KB)
 * @param file - The image file to compress
 * @param targetSizeKB - Target size in KB (default: 500)
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = async (file: File, targetSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= targetSizeKB * 1024) {
      // File is already within the target size, no compression needed
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        // Calculate dimensions to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Reduce quality iteratively to reach target size
        let quality = 0.9;
        let compressedBlob: Blob | null = null;
        
        const compress = () => {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            if (blob.size <= targetSizeKB * 1024) {
              // Successfully compressed
              compressedBlob = blob;
              const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // Reduce quality and try again
              quality -= 0.1;
              if (quality <= 0.1) {
                // Minimum quality reached, return the best we have
                if (compressedBlob) {
                  const compressedFile = new File([compressedBlob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  reject(new Error('Failed to compress image to target size'));
                }
              } else {
                // Try again with lower quality
                canvas.toBlob((newBlob) => {
                  if (newBlob) {
                    compressedBlob = newBlob;
                    compress();
                  } else {
                    reject(new Error('Failed to compress image'));
                  }
                }, 'image/jpeg', quality);
              }
            }
          }, 'image/jpeg', quality);
        };
        
        compress();
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compress an image and handle errors
 * @param file - The image file to compress
 * @param targetSizeKB - Target size in KB (default: 500)
 * @returns Promise<File | null> - Compressed image file or null if failed
 */
export const compressImageWithToast = async (file: File, targetSizeKB: number = 500): Promise<File | null> => {
  try {
    const compressedFile = await compressImage(file, targetSizeKB);
    console.log(`Image compressed from ${(file.size / 1024).toFixed(2)}KB to ${(compressedFile.size / 1024).toFixed(2)}KB`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    toast.error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};