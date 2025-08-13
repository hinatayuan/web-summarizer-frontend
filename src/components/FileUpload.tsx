import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null, fileUrl?: string) => void;
  acceptedTypes?: string;
  maxSize?: number; // MB
  className?: string;
  disabled?: boolean;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes = '.pdf',
  maxSize = 10, // 10MB 默认
  className = '',
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    // 检查文件类型
    if (acceptedTypes.includes('.pdf') && file.type !== 'application/pdf') {
      return '请选择PDF文件';
    }
    
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxSize}MB`;
    }
    
    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    
    try {
      // 创建文件URL用于预览
      const fileUrl = URL.createObjectURL(file);
      
      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl
      };
      
      setSelectedFile(fileInfo);
      
      // 对于PDF文件，我们需要上传到临时存储或转换为base64
      // 这里我们先创建一个临时的对象URL
      onFileSelect(file, fileUrl);
      
    } catch (err) {
      setError('文件处理失败');
      console.error('File processing error:', err);
    } finally {
      setUploading(false);
    }
  }, [onFileSelect, maxSize, acceptedTypes]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const removeFile = () => {
    if (selectedFile?.url) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!selectedFile ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200
            ${dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept={acceptedTypes}
            onChange={handleInputChange}
            disabled={disabled}
          />
          
          <div className="text-center">
            <Upload className={`mx-auto h-12 w-12 ${
              dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">
                {dragActive ? '释放文件到这里' : '点击或拖拽文件到这里'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持 {acceptedTypes} 格式，最大 {maxSize}MB
              </p>
            </div>
            
            {uploading && (
              <div className="mt-4">
                <div className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  处理中...
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <File className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </h4>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
              <div className="mt-2 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">文件已准备就绪</span>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              title="移除文件"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};