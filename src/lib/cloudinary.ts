// Remove server-side SDK import and use pure client-side approach
export const uploadToCloudinary = async (file: string, publicId?: string): Promise<string> => {
  try {
    console.log('Starting Cloudinary upload process');
    
    const formData = new FormData();
    formData.append('upload_preset', 'homework');
    formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
    
    if (publicId) {
      formData.append('public_id', `homework/${publicId}`);
    }
    
    let fileToUpload: Blob;
    let mimeType: string;

    if (file.startsWith('data:image')) {
      console.log('Processing data URL image');
      const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URL format');
      }
      
      mimeType = matches[1];
      const base64Data = matches[2];
      
      if (!mimeType.startsWith('image/')) {
        throw new Error('Invalid image type');
      }
      
      const byteCharacters = atob(base64Data);
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
    } else {
      console.log('Processing URL or File object');
      if (file instanceof Blob) {
        fileToUpload = file;
        mimeType = file.type || 'image/jpeg';
      } else if (typeof file === 'string' && file.startsWith('http')) {
        // Handle URLs by fetching them first
        const response = await fetch(file);
        const blob = await response.blob();
        fileToUpload = blob;
        mimeType = blob.type || 'image/jpeg';
      } else {
        throw new Error('Unsupported file format');
      }
    }
    
    // Validate file size (max 10MB)
    if (fileToUpload.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    console.log('File prepared for upload:', {
      size: fileToUpload.size,
      type: mimeType
    });
    
    formData.append('file', fileToUpload);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    
    if (!cloudName || !apiKey) {
      throw new Error('Cloudinary configuration is incomplete');
    }

    // Generate timestamp for the request
    const timestamp = Math.round((new Date()).getTime() / 1000);
    formData.append('timestamp', timestamp.toString());

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload error:', errorData);
      throw new Error(
        errorData.error?.message || 
        errorData.message || 
        'Failed to upload image'
      );
    }

    const data = await response.json();
    console.log('Upload successful');
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to upload image');
  }
};

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url: string): string => {
  try {
    // Extract the path after /upload/
    const matches = url.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
    if (!matches || !matches[1]) {
      throw new Error('Invalid Cloudinary URL format');
    }
    return matches[1];
  } catch (error) {
    console.error('Error extracting public ID:', error);
    throw new Error('Failed to extract public ID from URL');
  }
};

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is incomplete');
    }

    const publicId = getPublicIdFromUrl(imageUrl);
    const timestamp = Math.round((new Date()).getTime() / 1000);
    
    // Generate signature
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(stringToSign)
    ).then(buffer => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to delete image from Cloudinary');
    }

    const result = await response.json();
    if (result.result !== 'ok') {
      throw new Error('Failed to delete image from Cloudinary');
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error instanceof Error ? error : new Error('Failed to delete image from Cloudinary');
  }
};