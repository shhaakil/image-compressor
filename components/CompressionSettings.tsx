
import React, { useEffect } from 'react';
import { OutputFormat } from '../types';

interface CompressionSettingsProps {
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  quality: number;
  setQuality: (quality: number) => void;
}

export const CompressionSettings: React.FC<CompressionSettingsProps> = ({
  outputFormat,
  setOutputFormat,
  quality,
  setQuality,
}) => {
  const isPng = outputFormat === 'PNG';

  useEffect(() => {
    if (isPng) {
      setQuality(100); // PNG is lossless, quality is effectively 100%
    }
  }, [isPng, setQuality]);

  return (
    <div className="space-y-6 p-4 bg-slate-700/30 rounded-lg">
      <div>
        <label htmlFor="outputFormat" className="block text-sm font-medium text-slate-300 mb-1">
          Output Format:
        </label>
        <select
          id="outputFormat"
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 shadow-sm"
        >
          <option value="JPEG">JPEG</option>
          <option value="PNG">PNG</option>
          <option value="WEBP">WebP</option>
        </select>
      </div>

      <div>
        <label htmlFor="quality" className="block text-sm font-medium text-slate-300 mb-1">
          Quality ({isPng ? 'Lossless' : `${quality}%`}):
        </label>
        <input
          id="quality"
          type="range"
          min="1"
          max="100"
          value={quality}
          onChange={(e) => setQuality(parseInt(e.target.value, 10))}
          disabled={isPng}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer 
                      ${isPng ? 'bg-slate-600 cursor-not-allowed' : 'bg-slate-600 range-thumb-purple'}
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500`}
          aria-describedby="quality-note"
        />
        <style>{`
          .range-thumb-purple::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #a855f7; /* purple-500 */
            border-radius: 50%;
            cursor: pointer;
            margin-top: -7px; /* Adjust to center thumb on track */
          }
          .range-thumb-purple::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #a855f7; /* purple-500 */
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
          input[type="range"]:disabled::-webkit-slider-thumb {
            background: #4b5563; /* gray-600 */
          }
          input[type="range"]:disabled::-moz-range-thumb {
            background: #4b5563; /* gray-600 */
          }
        `}</style>
      </div>
       <p id="quality-note" className="text-xs text-slate-500">
          Note: Quality setting primarily affects JPEG and WebP formats. PNG is lossless.
        </p>
    </div>
  );
};
