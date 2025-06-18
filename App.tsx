
import React, { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ProgressBar } from './components/ProgressBar';
import { DownloadButton } from './components/DownloadButton';
import { ImagePreview } from './components/ImagePreview';
import { CompressionSettings } from './components/CompressionSettings';
import { AppStatus, ProcessedFile, OutputFormat } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [originalImagePreviewUrl, setOriginalImagePreviewUrl] = useState<string | null>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number, height: number } | null>(null);
  
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('JPEG');
  const [quality, setQuality] = useState<number>(100); // Default quality set to 100%
  
  const [compressedImagePreviewUrl, setCompressedImagePreviewUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const cleanupProcessedFileUrls = useCallback((file: ProcessedFile | null) => {
    if (file?.compressedUrl) {
      URL.revokeObjectURL(file.compressedUrl);
    }
  }, []);

  const resetState = useCallback(() => {
    if (originalImagePreviewUrl) {
        URL.revokeObjectURL(originalImagePreviewUrl);
    }
    if (compressedImagePreviewUrl && compressedImagePreviewUrl !== originalImagePreviewUrl) {
        URL.revokeObjectURL(compressedImagePreviewUrl);
    }
    
    cleanupProcessedFileUrls(processedFile);

    setOriginalImagePreviewUrl(null);
    setOriginalImageDimensions(null);
    setCompressedImagePreviewUrl(null);
    setCompressedSize(null);
    setProcessedFile(null); 

    setProgress(0);
    setErrorMessage(null);
    setOutputFormat('JPEG');
    setQuality(100); 
    setStatus(AppStatus.IDLE);
  }, [originalImagePreviewUrl, compressedImagePreviewUrl, processedFile, cleanupProcessedFileUrls]);


  // Effect for final cleanup on unmount
  useEffect(() => {
    const currentOriginalUrl = originalImagePreviewUrl;
    const currentCompressedPreviewUrl = compressedImagePreviewUrl;
    // Keep a reference to processedFile for cleanup
    const currentProcessedFile = processedFile;
  
    return () => {
      if (currentOriginalUrl) URL.revokeObjectURL(currentOriginalUrl);
      if (currentCompressedPreviewUrl && currentCompressedPreviewUrl !== currentOriginalUrl) {
        URL.revokeObjectURL(currentCompressedPreviewUrl);
      }
      cleanupProcessedFileUrls(currentProcessedFile);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Run only on mount and unmount


  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setStatus(AppStatus.ERROR);
    
    // Clean up potentially problematic URLs associated with the failed operation
    // Keep originalImagePreviewUrl if we want to allow "Try Again" on the same image without re-upload for certain errors
    // For now, let's clean it. If "Try Again" should preserve it, this logic needs adjustment.
    if (originalImagePreviewUrl) {
        URL.revokeObjectURL(originalImagePreviewUrl);
        setOriginalImagePreviewUrl(null);
    }
    if (compressedImagePreviewUrl && compressedImagePreviewUrl !== originalImagePreviewUrl) {
        URL.revokeObjectURL(compressedImagePreviewUrl);
    }
    setCompressedImagePreviewUrl(null); // Always nullify this on error
    cleanupProcessedFileUrls(processedFile); // Clean up download blob URL
    // processedFile itself will be reset by resetState if user clicks "Try Again"
  }, [originalImagePreviewUrl, compressedImagePreviewUrl, processedFile, cleanupProcessedFileUrls]);


  const handleFileSelect = useCallback((file: File) => {
    resetState(); 
    setStatus(AppStatus.VALIDATING);

    const pFile: ProcessedFile = {
      originalFile: file,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    const objectUrl = URL.createObjectURL(file);
    
    const img = new Image();
    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };
      setOriginalImageDimensions(dimensions);
      setOriginalImagePreviewUrl(objectUrl); 
      setProcessedFile({ ...pFile, originalDimensions: dimensions });
      
      if (file.type === 'image/png') {
        setOutputFormat('PNG');
        setQuality(100);
      } else {
        setOutputFormat('JPEG'); // Default for non-PNG
        setQuality(100);
      }
      setStatus(AppStatus.SETTINGS);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl); 
      handleError("Could not load image. Please check the file and try again.");
    };
    img.src = objectUrl;
    
  }, [resetState, handleError]);

  const handleStartCompression = useCallback(async () => {
    if (!processedFile || !originalImagePreviewUrl) return;
    
    // Clean up URLs from any previous compression attempt for this file before starting a new one
    if (compressedImagePreviewUrl) {
        URL.revokeObjectURL(compressedImagePreviewUrl);
        setCompressedImagePreviewUrl(null);
    }
    if (processedFile.compressedUrl) {
        URL.revokeObjectURL(processedFile.compressedUrl);
        // Update processedFile state to remove the old URL
        setProcessedFile(pf => pf ? { ...pf, compressedUrl: undefined, compressedSize: undefined } : null);
    }
    setCompressedSize(null);


    setStatus(AppStatus.COMPRESSING);
    setProgress(0);
    
    let progressInterval: NodeJS.Timeout | undefined = undefined;
    
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 80) return prev + 10;
        clearInterval(progressInterval as NodeJS.Timeout);
        return prev;
      });
    }, 50);

    try {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          if (progressInterval) clearInterval(progressInterval);
          handleError("Could not get canvas context for compression.");
          return;
        }
        ctx.drawImage(image, 0, 0, image.width, image.height);

        let mimeType = `image/${outputFormat.toLowerCase()}`;
        if (outputFormat === 'JPEG') mimeType = 'image/jpeg'; 

        let compressionQualityArg: number | undefined = undefined;
        if (outputFormat === 'JPEG' || outputFormat === 'WEBP') {
          compressionQualityArg = quality / 100;
        }

        canvas.toBlob(
          (blob) => {
            if (progressInterval) clearInterval(progressInterval);
            if (!blob) {
              handleError("Compression failed: could not create image blob.");
              return;
            }
            setProgress(100);

            const compressedFileUrl = URL.createObjectURL(blob);
            const actualCompressedSize = blob.size;
            
            setCompressedSize(actualCompressedSize);
            setCompressedImagePreviewUrl(compressedFileUrl); // Use this for preview

            setProcessedFile(pf => pf ? { 
              ...pf, 
              // Note: compressedUrl for download should be distinct from preview if needed,
              // but for simplicity, we can use the same. If preview is more temporary, then manage separately.
              // For now, compressedImagePreviewUrl is used for preview, and we'll create a new URL for download link if they differ.
              // Let's store the blob URL intended for download in processedFile.compressedUrl
              compressedUrl: compressedFileUrl, 
              compressedSize: actualCompressedSize,
              outputFormat: outputFormat 
            } : null);
            setStatus(AppStatus.COMPLETE);
          },
          mimeType,
          compressionQualityArg
        );
      };
      image.onerror = () => {
        if (progressInterval) clearInterval(progressInterval);
        handleError("Could not load image for compression process.");
      };
      image.src = originalImagePreviewUrl;
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      handleError(`Compression error: ${error instanceof Error ? error.message : String(error)}`);
    }

  }, [processedFile, quality, outputFormat, originalImagePreviewUrl, handleError, compressedImagePreviewUrl]);


  const handleBackToSettings = useCallback(() => {
    if (!processedFile) return; // Should not happen if this button is visible

    // Clean up URLs from the COMPLETED compression attempt
    if (compressedImagePreviewUrl) {
        URL.revokeObjectURL(compressedImagePreviewUrl);
        setCompressedImagePreviewUrl(null);
    }
    if (processedFile.compressedUrl) {
        URL.revokeObjectURL(processedFile.compressedUrl);
    }

    setCompressedSize(null);
    // Important: Update processedFile to remove the stale compressedUrl and compressedSize
    setProcessedFile(pf => pf ? {
         ...pf, 
         compressedUrl: undefined, 
         compressedSize: undefined,
         // outputFormat might remain as it was the last used, or reset if desired. Keeping it.
        } : null
    );
    // The originalImagePreviewUrl, originalImageDimensions, outputFormat, and quality are preserved.
    setStatus(AppStatus.SETTINGS);
  }, [processedFile, compressedImagePreviewUrl]);


  const getFileNameAndExtension = (fileName: string) => {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) {
      return { name: fileName, extension: '' };
    }
    return {
      name: fileName.substring(0, lastDot),
      extension: fileName.substring(lastDot + 1)
    };
  };

  const handleDownload = () => {
    // The compressedImagePreviewUrl is used for the <ImagePreview/>
    // The processedFile.compressedUrl is the one we want for download. They might be the same.
    if (processedFile?.compressedUrl && processedFile?.name && processedFile.outputFormat) {
      const link = document.createElement('a');
      link.href = processedFile.compressedUrl; 
      
      const { name: originalNameWithoutExt } = getFileNameAndExtension(processedFile.name);
      link.download = `compressed_${originalNameWithoutExt}.${processedFile.outputFormat.toLowerCase()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const calculateReduction = () => {
    if (processedFile && processedFile.size && compressedSize && compressedSize > 0 && processedFile.size > 0) {
      const reduction = ((processedFile.size - compressedSize) / processedFile.size) * 100;
      return Math.max(0, reduction).toFixed(1);
    }
    return '0.0';
  };
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-gray-100 selection:bg-purple-500 selection:text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
          Image Compressor Pro
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base">Upload, configure, compress, and download your images.</p>
      </header>

      <main className="w-full max-w-lg bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl p-6 sm:p-10 transition-all duration-500 ease-in-out">
        {status === AppStatus.IDLE && (
          <ImageUploader onFileSelect={handleFileSelect} onError={handleError} disabled={false} />
        )}

        {status === AppStatus.VALIDATING && (
           <div className="text-center py-8">
            <div role="status" className="flex justify-center items-center mb-4">
                <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin dark:text-purple-400 fill-pink-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
            <p className="text-lg font-medium text-slate-300">Validating & preparing image...</p>
           </div>
        )}
        
        {status === AppStatus.SETTINGS && processedFile && originalImagePreviewUrl && originalImageDimensions && (
          <div className="space-y-6">
            <ImagePreview
              src={originalImagePreviewUrl}
              alt="Original image preview"
              title="Original Image"
              info={`Size: ${formatBytes(processedFile.size)} (${originalImageDimensions.width}x${originalImageDimensions.height})`}
            />
            <CompressionSettings
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
              quality={quality}
              setQuality={setQuality}
            />
            <button
              onClick={handleStartCompression}
              className="w-full py-3.5 px-6 text-base font-semibold rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 hover:from-purple-700 hover:via-pink-600 hover:to-red-600 text-white shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500"
            >
              Compress Image
            </button>
          </div>
        )}

        {status === AppStatus.COMPRESSING && processedFile && (
          <div className="text-center py-8 space-y-4">
            <p className="text-lg font-medium text-slate-300">Compressing: <span className="font-semibold text-purple-400">{processedFile.name}</span></p>
            <p className="text-sm text-slate-400">Format: <span className="font-semibold text-purple-400">{outputFormat}</span>, Quality: <span className="font-semibold text-purple-400">{outputFormat === 'PNG' ? 'Lossless' : `${quality}%`}</span></p>
            <ProgressBar progress={progress} />
            <p className="text-sm text-slate-500">Please wait...</p>
          </div>
        )}

        {status === AppStatus.COMPLETE && processedFile && compressedImagePreviewUrl && compressedSize && (
          <div className="space-y-6 text-center">
             <ImagePreview
              src={compressedImagePreviewUrl} 
              alt="Compressed image preview"
              title="Compressed Image"
              info={`Size: ${formatBytes(compressedSize)} (${processedFile.outputFormat}) | Reduction: ${calculateReduction()}%`}
            />
            <div className="space-y-3 pt-2">
              <DownloadButton onClick={handleDownload} disabled={!processedFile.compressedUrl} />
              <button
                onClick={handleBackToSettings}
                className="w-full py-3 px-6 text-sm font-semibold rounded-lg bg-slate-600 hover:bg-slate-500 transition-colors duration-150 text-slate-100 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                Modify Settings
              </button>
              <button
                onClick={resetState}
                className="w-full py-3 px-6 text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors duration-150 text-slate-200 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                Compress Another Image
              </button>
            </div>
          </div>
        )}
        
        {status === AppStatus.ERROR && (
          <div className="text-center py-8">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-400 mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h2 className="text-2xl font-semibold text-red-300 mb-2">Oops! Something went wrong.</h2>
            {errorMessage && <p className="text-slate-300 mb-6">{errorMessage}</p>}
            <button
              onClick={resetState}
              className="w-full py-3 px-6 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors duration-150 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
      <footer className="mt-12 text-center">
        <p className="text-sm text-slate-500">
          Powered by React & Tailwind CSS. &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
