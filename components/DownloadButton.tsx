
import React from 'react';

interface DownloadButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const DownloadButton: React.FC<DownloadButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center py-3.5 px-6 border border-transparent 
        text-base font-semibold rounded-lg shadow-lg
        text-white 
        bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 
        hover:from-purple-700 hover:via-pink-600 hover:to-red-600 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500
        transition-all duration-200 ease-in-out transform hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-slate-600
      `}
    >
      <DownloadIcon className="w-5 h-5 mr-2" />
      Download Compressed Image
    </button>
  );
};
