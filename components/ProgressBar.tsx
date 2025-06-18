
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const cappedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-slate-700 rounded-full h-4 shadow-inner overflow-hidden">
      <div
        className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 ease-out text-xs font-medium text-purple-100 text-center p-0.5 leading-none"
        style={{ width: `${cappedProgress}%` }}
        role="progressbar"
        aria-valuenow={cappedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
       {cappedProgress > 10 ? `${cappedProgress}%` : ''}
      </div>
    </div>
  );
};
