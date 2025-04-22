import axios from 'axios';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  asset_id: string;
  format: string;
  version: number;
  resource_type: string;
  signature: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
  url: string;
}

export const normalizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

const extractPublicId = (url: string): string | null => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return matches ? matches[1] : null;
};

export const uploadToCloudinary = async (file: string | File, filename?: string): Promise<string> => {
  const getResourceType = (fileType: string) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm'];
    const rawTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (imageTypes.includes(fileType)) return 'image';
    if (videoTypes.includes(fileType)) return 'video';
    if (rawTypes.includes(fileType)) return 'raw';
    return 'raw';
  };

  try {
    let fileToUpload: Blob;
    let mimeType: string;
    let resourceType: string;
    let cleanFilename: string | undefined;

    if (file instanceof File) {
      fileToUpload = file;
      mimeType = file.type;
      resourceType = getResourceType(mimeType);
      cleanFilename = filename || normalizeFilename(file.name);
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      const matches = file.match(/^data:([^;,]+)(?:;[^;,]+)*(?:;base64)?,(.+)$/);
      if (!matches) throw new Error('Invalid data URL format');
      const base64Data = matches[2];
      mimeType = matches[1];
      resourceType = getResourceType(mimeType);
      const byteCharacters = file.includes(';base64,') ? atob(base64Data) : decodeURIComponent(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      fileToUpload = new Blob(byteArrays, { type: mimeType });
      cleanFilename = filename;
    } else {
      const response = await fetch(file);
      fileToUpload = await response.blob();
      mimeType = fileToUpload.type;
      resourceType = getResourceType(mimeType);
      cleanFilename = filename;
    }

    if (fileToUpload.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('resource_type', resourceType);
    formData.append('upload_preset', 'homework');
    
    if (cleanFilename) {
      formData.append('public_id', `resources/${cleanFilename}`);
    }
    
    formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
    formData.append('timestamp', Math.round(Date.now() / 1000).toString());

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) throw new Error('Cloudinary cloud name not configured');

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await uploadResponse.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
};

export const deleteFromCloudinary = async (fileUrl: string) => {
  try {
    const matches = fileUrl.match(/\/v\d+\/(.+?)(?:\.\w+)?$/);
    const publicId = matches?.[1];
    if (!publicId) {
      throw new Error('Could not extract public ID from URL');
    }

    const extensionMatch = fileUrl.match(/\.(\w+)(?:\?|$)/);
    const extension = extensionMatch?.[1]?.toLowerCase() || '';

    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      resourceType = 'image';
    } else if (['mp4', 'webm'].includes(extension)) {
      resourceType = 'video';
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is incomplete');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = await generateSignature(publicId, timestamp, apiSecret);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error instanceof Error ? error : new Error('Failed to delete file');
  }
};

async function generateSignature(publicId: string, timestamp: number, apiSecret: string) {
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}