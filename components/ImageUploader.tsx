
import React, { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
  disabled: boolean;
}

const UploadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-12 h-12"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75Z" />
  </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, onError, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileValidation = useCallback((file: File | null) => {
    if (!file) {
      onError('No file selected.');
      return false;
    }
    if (!acceptedFileTypes.includes(file.type)) {
      onError(`Invalid file type. Please upload JPG, JPEG, or PNG. You uploaded: ${file.type}`);
      return false;
    }
    if (file.size > maxFileSize) {
      onError(`File is too large. Maximum size is ${maxFileSize / (1024*1024)}MB. Your file: ${(file.size / (1024*1024)).toFixed(2)}MB`);
      return false;
    }
    return true;
  }, [acceptedFileTypes, maxFileSize, onError]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (handleFileValidation(file)) {
      onFileSelect(file!);
    }
  }, [disabled, handleFileValidation, onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (handleFileValidation(file)) {
      onFileSelect(file!);
    }
    event.target.value = ''; // Reset file input
  }, [handleFileValidation, onFileSelect]);

  const uploaderClasses = `
    flex flex-col items-center justify-center p-8 sm:p-12 border-2 
    border-dashed rounded-xl transition-all duration-300 ease-in-out
    ${isDragging ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-slate-600 hover:border-purple-400'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={uploaderClasses}
        onClick={() => !disabled && document.getElementById('fileInput')?.click()}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
        />
        <UploadIcon className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'}`} />
        <p className={`text-center font-semibold ${isDragging ? 'text-purple-300' : 'text-slate-300'}`}>
          Drag & drop your image here
        </p>
        <p className={`text-sm ${isDragging ? 'text-purple-400' : 'text-slate-500'}`}>
          or click to browse
        </p>
        <p className="mt-3 text-xs text-slate-500">Supports: JPG, JPEG, PNG (Max 10MB)</p>
      </div>
    </div>
  );
};
