'use client';

import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';
import { Icon } from './Icon';

export interface FilePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
  label?: string;
  files?: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  buttonText?: string;
  emptyText?: string;
  helperText?: string;
  error?: string;
  clearable?: boolean;
  wrapperClassName?: string;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  label,
  files = [],
  onFilesChange,
  multiple = false,
  buttonText,
  emptyText = 'لم يتم اختيار ملف بعد',
  helperText,
  error,
  clearable = true,
  wrapperClassName,
  className,
  id,
  name,
  disabled,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = React.useId();
  const inputId = id || name || generatedId;
  const hasFiles = files.length > 0;

  const selectedText = hasFiles
    ? files.length === 1
      ? files[0].name
      : `${files.length} ملفات مختارة`
    : emptyText;

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const clearFiles = () => {
    if (disabled) return;
    onFilesChange([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilesChange(Array.from(event.target.files || []));
  };

  return (
    <div className={clsx('form-group ui-form-group', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId}>
          {label}
        </label>
      )}

      <input
        {...props}
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="ux-hidden"
      />

      <div
        className={clsx(
          'form-input ux-w-full ux-min-h-[52px] ux-flex ux-items-center ux-justify-between ux-gap-3 ux-px-4',
          error && 'error',
          disabled && 'ux-opacity-60',
          className,
        )}
      >
        <div className="ux-flex ux-items-center ux-gap-2 ux-min-w-0">
          <Icon name={multiple ? 'folder-open' : 'file'} className="ux-text-gray-400 ux-shrink-0" />
          <span className={clsx('ux-text-sm ux-truncate', hasFiles ? 'ux-text-white' : 'ux-text-gray-500')}>
            {selectedText}
          </span>
        </div>

        <div className="ux-flex ux-items-center ux-gap-2 ux-shrink-0">
          {clearable && hasFiles && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFiles} disabled={disabled}>
              <Icon name="times" size="xs" />
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={disabled}>
            {buttonText || (multiple ? 'اختيار ملفات' : 'اختيار ملف')}
          </Button>
        </div>
      </div>

      {files.length > 1 && (
        <div className="ux-mt-2 ux-flex ux-flex-wrap ux-gap-2">
          {files.slice(0, 4).map((file) => (
            <span key={`${file.name}-${file.size}`} className="ux-text-xs ux-px-2 ux-py-1 ux-rounded-full ux-bg-white/10 ux-text-gray-300">
              {file.name}
            </span>
          ))}
          {files.length > 4 && (
            <span className="ux-text-xs ux-px-2 ux-py-1 ux-rounded-full ux-bg-white/5 ux-text-gray-400">
              +{files.length - 4}
            </span>
          )}
        </div>
      )}

      {helperText && !error && (
        <p className="ux-mt-2 ux-text-xs ux-text-gray-400">{helperText}</p>
      )}

      {error && (
        <span className="error-message">
          <Icon name="exclamation-circle" size="xs" />
          {error}
        </span>
      )}
    </div>
  );
};

export default FilePicker;
