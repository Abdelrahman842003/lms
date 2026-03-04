'use client';

import React, { useState, useRef, useEffect } from 'react';
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/services/avatarService';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function AvatarUpload({
  currentAvatarUrl,
  onUploadSuccess,
  onDeleteSuccess,
  size = 'medium',
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size mapping
  const sizeClasses = {
    small: 'avatar-size-small',
    medium: 'avatar-size-medium',
    large: 'avatar-size-large',
  };

  // Load avatar URL on mount
  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      const response = await getAvatarUrl();
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
      }
    } catch (err) {
      // No avatar found, which is fine
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة صحيحة');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن لا يتجاوز 5 ميغابايت');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await uploadAvatar(file);
      
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
        setPreviewUrl(null);
        setSuccess('تم رفع الصورة بنجاح');
        
        if (onUploadSuccess) {
          onUploadSuccess(response.data.url);
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصورة');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف الصورة؟')) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteAvatar();
      setAvatarUrl(null);
      setPreviewUrl(null);
      setSuccess('تم حذف الصورة بنجاح');
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'فشل حذف الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-upload-preview">
        {/* Avatar Display */}
        <div className={`avatar-circle ${sizeClasses[size]}`}>
          {previewUrl || avatarUrl ? (
            <img
              src={previewUrl || avatarUrl || ''}
              alt="Avatar"
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="avatar-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
          )}
          
          {/* Loading Overlay */}
          {isUploading && (
            <div className="avatar-upload-overlay">
              <div className="spinner"></div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="avatar-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="ux-hidden"
          />
          
          <button
            onClick={handleButtonClick}
            disabled={isUploading}
            className="btn btn-primary btn-sm"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="btn-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            {avatarUrl ? 'تغيير الصورة' : 'رفع صورة'}
          </button>

          {avatarUrl && !isUploading && (
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="btn-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              حذف
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
    </div>
  );
}
