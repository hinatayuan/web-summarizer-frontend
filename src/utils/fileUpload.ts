// 文件上传工具函数

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 将文件转换为Base64字符串
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * 上传文件到临时存储
 * 这里我们使用一个简单的方法：将PDF文件转换为base64，然后通过API传递
 */
export const uploadFileToTempStorage = async (file: File): Promise<UploadResult> => {
  try {
    // 检查文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: '文件大小超过10MB限制'
      };
    }

    // 对于开发环境，我们可以使用几种方案：
    // 1. 转换为base64传递给后端
    // 2. 上传到临时存储服务（如Cloudflare R2, AWS S3等）
    // 3. 使用本地文件服务器

    // 方案1：转换为base64（适合小文件）
    if (file.size < 5 * 1024 * 1024) { // 5MB以下使用base64
      const base64 = await fileToBase64(file);
      return {
        success: true,
        url: base64 // 返回base64 URL
      };
    }

    // 方案2：上传到临时存储（需要配置存储服务）
    // 这里我们模拟一个上传过程
    const formData = new FormData();
    formData.append('file', file);

    // 如果有配置的文件上传端点，使用它
    const uploadEndpoint = import.meta.env.VITE_FILE_UPLOAD_ENDPOINT;
    if (uploadEndpoint) {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          url: result.url
        };
      } else {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    }

    // 方案3：使用对象URL（仅适用于同域访问）
    const objectUrl = URL.createObjectURL(file);
    return {
      success: true,
      url: objectUrl
    };

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '文件上传失败'
    };
  }
};

/**
 * 清理临时文件URL
 */
export const cleanupTempUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * 获取文件信息
 */
export const getFileInfo = (file: File) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    sizeFormatted: formatFileSize(file.size)
  };
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};