'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { LoadingSpinner, Button, Icon } from '.';
import { cn } from '@/utils';

interface ImageCropModalProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ image, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: any) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);
  const onCropCompleteCallback = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg');
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (error) {
      alert('حدث خطأ أثناء معالجة الصورة');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      
      <div className="relative w-full max-w-md premium-glass premium-border rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="crop" size="sm" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">تعديل الصورة الشخصية</h3>
           </div>
           <button onClick={onCancel} className="text-gray-light/20 hover:text-white transition-colors">
             <Icon name="times" />
           </button>
        </div>

        <div className="relative h-80 bg-black/40">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 text-gray-light/20">
            <Icon name="search-minus" size="xs" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
            />
            <Icon name="search-plus" size="xs" />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={isProcessing}
              className="flex-1 h-11 rounded-xl border-white/10 text-gray-light hover:bg-white/5 font-black uppercase tracking-widest"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isProcessing}
              className="flex-1 h-11 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              {isProcessing ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  <Icon name="check" className="ml-2" />
                  حفظ الصورة
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
