
import React from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  title: string;
  info: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, title, info }) => {
  return (
    <div className="space-y-3 text-center">
      <h3 className="text-xl font-semibold text-slate-200">{title}</h3>
      <div className="bg-slate-700/50 p-2 rounded-lg shadow-inner aspect-video flex items-center justify-center">
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-60 object-contain rounded" 
        />
      </div>
      <p className="text-sm text-slate-400">{info}</p>
    </div>
  );
};
