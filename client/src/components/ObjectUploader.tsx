import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, X, Check } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string; name: string }> }) => void;
}

/**
 * A file upload component with permanent drag-and-drop area and browse button.
 * 
 * Features:
 * - Always visible drag-and-drop zone
 * - Separate browse button for file selection
 * - Upload progress tracking
 * - File preview
 * - Error handling
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
}: ObjectUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return false;
    }
    
    if (file.size > maxFileSize) {
      setUploadError(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return false;
    }
    
    setUploadError(null);
    return true;
  };

  const handleFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
      setIsCompleted(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      console.log('Getting upload parameters...');
      const { url } = await onGetUploadParameters();
      console.log('Uploading file to:', url);

      const response = await fetch(url, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      console.log('Upload successful');
      setUploadProgress(100);
      setIsCompleted(true);

      // Call completion callback
      if (onComplete) {
        onComplete({
          successful: [{
            uploadURL: url.split('?')[0], // Remove query parameters
            name: selectedFile.name
          }]
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setIsCompleted(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Browse Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowseClick}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Browse Files
        </Button>
        
        {selectedFile && !isCompleted && (
          <Button
            type="button"
            onClick={uploadFile}
            disabled={isUploading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
      </div>

      {/* Permanent Drag & Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${selectedFile ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag and drop an image here, or use the browse button above
            </p>
            <p className="text-xs text-gray-500">
              Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File Info */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border">
              <div className="flex items-center gap-3">
                {selectedFile.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-32">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Success Message */}
            {isCompleted && (
              <p className="text-sm text-green-600 font-medium">
                Upload completed successfully!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        multiple={maxNumberOfFiles > 1}
      />
    </div>
  );
}