import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';

interface ImageCropperProps {
  imageSrc: string;
  type: 'avatar' | 'cover';
  onCropComplete: (cropData: Crop, pixelCrop: PixelCrop) => void;
  onCancel: () => void;
  initialCrop?: Crop;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  type,
  onCropComplete,
  onCancel,
  initialCrop
}) => {
  const [crop, setCrop] = useState<Crop>(initialCrop || {
    unit: '%',
    width: type === 'avatar' ? 50 : 80,
    height: type === 'avatar' ? 50 : 60,
    x: type === 'avatar' ? 25 : 10,
    y: type === 'avatar' ? 25 : 20,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    console.log('Image loaded successfully:', { width, height, src: imageSrc });

    // For avatar, create a square crop
    if (type === 'avatar') {
      const crop = makeAspectCrop(
        {
          unit: '%',
          width: 50,
        },
        1, // aspect ratio 1:1 for square
        width,
        height
      );
      const centeredCrop = centerCrop(crop, width, height);
      setCrop(centeredCrop);
    } else {
      // For cover, create a rectangular crop
      const crop = makeAspectCrop(
        {
          unit: '%',
          width: 80,
          height: 60,
        },
        4/3, // aspect ratio 4:3 for cover
        width,
        height
      );
      const centeredCrop = centerCrop(crop, width, height);
      setCrop(centeredCrop);
    }
  }, [type, imageSrc]);

  const onImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', { src: imageSrc, error: e });
  }, [imageSrc]);

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const handleConfirm = () => {
    if (completedCrop) {
      onCropComplete(crop, completedCrop);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {type === 'avatar' ? 'Crop Avatar Image' : 'Crop Cover Image'}
        </h3>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            {type === 'avatar'
              ? 'Drag to reposition the crop area. The selected area will be used for your avatar.'
              : 'Drag to reposition the crop area. The selected area will be used for your cover image.'
            }
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <ReactCrop
            crop={crop}
            onChange={setCrop}
            onComplete={handleCropComplete}
            aspect={type === 'avatar' ? 1 : 4/3}
            circularCrop={type === 'avatar'}
            className="max-w-full max-h-[60vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              onError={onImageError}
              crossOrigin="anonymous"
              className="max-w-full max-h-[60vh] object-contain"
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!completedCrop}
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;