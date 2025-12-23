import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';

interface SimpleImageCropperProps {
  imageSrc: string;
  type: 'avatar' | 'cover';
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

const SimpleImageCropper: React.FC<SimpleImageCropperProps> = ({
  imageSrc,
  type,
  onCropComplete,
  onCancel
}) => {
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({
    mouseX: 0,
    mouseY: 0,
    cropX: 0,
    cropY: 0
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'none' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      
      // Set initial crop area based on image type
      if (type === 'avatar') {
        // Square crop for avatar
        const size = Math.min(img.width, img.height) * 0.5;
        setCropArea({
          x: (img.width - size) / 2,
          y: (img.height - size) / 2,
          width: size,
          height: size
        });
      } else {
        // Rectangular crop for cover
        const width = img.width * 0.8;
        const height = img.height * 0.6;
        setCropArea({
          x: (img.width - width) / 2,
          y: (img.height - height) / 2,
          width: width,
          height: height
        });
      }
    };
  }, [imageSrc, type]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle mouse down on the crop box (not resize handles), not the image
    if (cropRef.current && cropRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).classList.contains('w-8')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      
      // Store the initial mouse position and crop position
      setStartPos({
        mouseX: e.clientX,
        mouseY: e.clientY,
        cropX: cropArea.x,
        cropY: cropArea.y
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    // Store initial size and mouse position
    setStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: cropArea.x,
      cropY: cropArea.y
    });
    setInitialSize({ width: cropArea.width, height: cropArea.height });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !containerRef.current || !imgRef.current) return;
    
    e.preventDefault();
    
    const imgRect = imgRef.current.getBoundingClientRect();
    
    // Calculate the scale factors based on actual image display size
    const scaleX = imageSize.width / imgRect.width;
    const scaleY = imageSize.height / imgRect.height;
    
    if (isDragging) {
      // Handle dragging
      // Calculate how much the mouse has moved
      const deltaX = (e.clientX - startPos.mouseX) * scaleX;
      const deltaY = (e.clientY - startPos.mouseY) * scaleY;
      
      // Calculate new position based on initial position + movement
      let newX = startPos.cropX + deltaX;
      let newY = startPos.cropY + deltaY;
      
      // Keep the crop area within image bounds
      newX = Math.max(0, Math.min(imageSize.width - cropArea.width, newX));
      newY = Math.max(0, Math.min(imageSize.height - cropArea.height, newY));
      
      setCropArea(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (isResizing) {
      // Handle resizing
      const deltaX = (e.clientX - startPos.mouseX) * scaleX;
      const deltaY = (e.clientY - startPos.mouseY) * scaleY;
      
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      let newX = startPos.cropX;
      let newY = startPos.cropY;
      
      // Apply resizing based on direction
      switch (resizeDirection) {
        case 'nw':
          newWidth = Math.max(50, initialSize.width - deltaX);
          newHeight = Math.max(50, initialSize.height - deltaY);
          newX = startPos.cropX + (initialSize.width - newWidth);
          newY = startPos.cropY + (initialSize.height - newHeight);
          break;
        case 'ne':
          newWidth = Math.max(50, initialSize.width + deltaX);
          newHeight = Math.max(50, initialSize.height - deltaY);
          newY = startPos.cropY + (initialSize.height - newHeight);
          break;
        case 'sw':
          newWidth = Math.max(50, initialSize.width - deltaX);
          newHeight = Math.max(50, initialSize.height + deltaY);
          newX = startPos.cropX + (initialSize.width - newWidth);
          break;
        case 'se':
          newWidth = Math.max(50, initialSize.width + deltaX);
          newHeight = Math.max(50, initialSize.height + deltaY);
          break;
      }
      
      // For avatar, maintain aspect ratio
      if (type === 'avatar') {
        const size = Math.min(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
        
        // Adjust position based on which corner is being resized
        switch (resizeDirection) {
          case 'nw':
            newX = startPos.cropX + (initialSize.width - newWidth);
            newY = startPos.cropY + (initialSize.height - newHeight);
            break;
          case 'ne':
            newY = startPos.cropY + (initialSize.height - newHeight);
            break;
          case 'sw':
            newX = startPos.cropX + (initialSize.width - newWidth);
            break;
          case 'se':
            // No position adjustment needed
            break;
        }
      }
      
      // Keep within image bounds
      newX = Math.max(0, Math.min(imageSize.width - newWidth, newX));
      newY = Math.max(0, Math.min(imageSize.height - newHeight, newY));
      
      setCropArea({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('none');
  };

  const handleCrop = () => {
    if (!imgRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to crop area
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    
    // Draw the cropped portion
    ctx.drawImage(
      imgRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );
    
    // Convert to blob and return
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.95);
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
              ? 'Click and drag the crop area to select your avatar.'
              : 'Click and drag the crop area to select your cover image.'
            }
          </p>
        </div>

        <div
          ref={containerRef}
          className="flex justify-center mb-6 relative overflow-hidden max-h-[60vh]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            className="max-w-full max-h-[60vh] object-contain select-none"
            crossOrigin="anonymous"
          />
          
          {/* Dark overlay for areas outside the crop - top */}
          <div className="absolute bg-black bg-opacity-60" style={{
            left: '0',
            top: '0',
            right: '0',
            height: `${(cropArea.y / imageSize.height) * 100}%`
          }} />
          
          {/* Dark overlay for areas outside the crop - bottom */}
          <div className="absolute bg-black bg-opacity-60" style={{
            left: '0',
            bottom: '0',
            right: '0',
            height: `${((imageSize.height - cropArea.y - cropArea.height) / imageSize.height) * 100}%`,
            top: 'auto'
          }} />
          
          {/* Dark overlay for areas outside the crop - left */}
          <div className="absolute bg-black bg-opacity-60" style={{
            left: '0',
            top: `${(cropArea.y / imageSize.height) * 100}%`,
            width: `${(cropArea.x / imageSize.width) * 100}%`,
            height: `${(cropArea.height / imageSize.height) * 100}%`
          }} />
          
          {/* Dark overlay for areas outside the crop - right */}
          <div className="absolute bg-black bg-opacity-60" style={{
            right: '0',
            top: `${(cropArea.y / imageSize.height) * 100}%`,
            width: `${((imageSize.width - cropArea.x - cropArea.width) / imageSize.width) * 100}%`,
            height: `${(cropArea.height / imageSize.height) * 100}%`
          }} />
          
          <div
            ref={cropRef}
            className={`absolute border-4 border-primary ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              left: `${(cropArea.x / imageSize.width) * 100}%`,
              top: `${(cropArea.y / imageSize.height) * 100}%`,
              width: `${(cropArea.width / imageSize.width) * 100}%`,
              height: `${(cropArea.height / imageSize.height) * 100}%`,
              aspectRatio: type === 'avatar' ? '1/1' : '4/3',
              transition: isDragging || isResizing ? 'none' : 'all 0.1s ease',
              backgroundColor: 'transparent'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
          >
            {/* Resize handles */}
            <div
              className="absolute w-8 h-8 bg-primary rounded-full -top-4 -left-4 cursor-nwse-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, 'nw');
              }}
            />
            <div
              className="absolute w-8 h-8 bg-primary rounded-full -top-4 -right-4 cursor-nesw-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, 'ne');
              }}
            />
            <div
              className="absolute w-8 h-8 bg-primary rounded-full -bottom-4 -left-4 cursor-nesw-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, 'sw');
              }}
            />
            <div
              className="absolute w-8 h-8 bg-primary rounded-full -bottom-4 -right-4 cursor-nwse-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, 'se');
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCrop}
            disabled={!cropArea.width || !cropArea.height}
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleImageCropper;