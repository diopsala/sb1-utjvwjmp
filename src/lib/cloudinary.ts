export const uploadToCloudinary = async (file: string) => {
  const getResourceType = (fileType: string) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm'];
    
    if (imageTypes.includes(fileType)) return 'image';
    if (videoTypes.includes(fileType)) return 'video';
    return 'raw';
  };

  try {
    let fileToUpload: Blob;
    let mimeType: string;
    let resourceType: string;

    if (file.startsWith('data:')) {
      // More lenient regex that handles optional parameters
      const matches = file.match(/^data:([^;,]+)(?:;[^;,]+)*(?:;base64)?,(.+)$/);
      if (!matches) throw new Error('Invalid data URL format');
      
      const base64Data = matches[2];
      mimeType = matches[1];
      resourceType = getResourceType(mimeType);
      
      // Handle both base64 and non-base64 data URLs
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
    } else {
      const response = await fetch(file);
      fileToUpload = await response.blob();
      mimeType = fileToUpload.type;
      resourceType = getResourceType(mimeType);
    }

    if (fileToUpload.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('resource_type', resourceType);
    formData.append('upload_preset', 'homework');
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

export const deleteFromCloudinary = async (imageUrl: string) => {
  try {
    const matches = imageUrl.match(/\/v\d+\/([^/]+)\.[^.]+$/);
    const publicId = matches?.[1];

    if (!publicId) { 
      throw new Error('Could not extract public ID from URL');
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

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to delete image');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error instanceof Error ? error : new Error('Failed to delete image');
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