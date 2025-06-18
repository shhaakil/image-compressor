
export enum AppStatus {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SETTINGS = 'settings', // New status for showing original image and settings
  COMPRESSING = 'compressing',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export type OutputFormat = 'JPEG' | 'PNG' | 'WEBP';

export interface ProcessedFile {
  originalFile: File;
  name: string;
  size: number; // in bytes
  type: string;
  originalDimensions?: { width: number; height: number };
  compressedUrl?: string; // For simulated download
  compressedSize?: number;
  outputFormat?: OutputFormat;
}
