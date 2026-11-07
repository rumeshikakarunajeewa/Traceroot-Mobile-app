// src/services/storage.service.ts
// Supabase Storage service for TraceRoot photo evidence, avatars, and harvest images.

import { supabase } from '../lib/supabase';

export type StorageBucket = 'avatars' | 'cultivation-photos' | 'harvest-images' | 'catalogue-images';

export interface UploadResult {
  url: string | null;
  path: string | null;
  error: string | null;
}

/**
 * Reads a local device URI and converts it to an ArrayBuffer for Supabase Storage.
 */
async function uriToArrayBuffer(localUri: string): Promise<ArrayBuffer> {
  const response = await fetch(localUri);
  if (typeof response.arrayBuffer === 'function') {
    return await response.arrayBuffer();
  }
  const blob = await response.blob();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Upload an avatar image for a user.
 * Conforms to storage RLS policy: folder name must equal auth.uid().
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<UploadResult> {
  try {
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    const mimeType = cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const fileName = `avatar-${Date.now()}.${cleanExt}`;
    const filePath = `${userId}/${fileName}`;

    const arrayBuffer = await uriToArrayBuffer(localUri);

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[Storage] Error uploading avatar:', error.message);
      return { url: null, path: null, error: error.message };
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (err: any) {
    console.error('[Storage] Exception uploading avatar:', err);
    return {
      url: null,
      path: null,
      error: err.message || 'Failed to upload avatar image.',
    };
  }
}

/**
 * Upload cultivation photo evidence to private storage bucket.
 * Folder structure: {farmer_id}/{harvest_id}/{timestamp}.jpg
 */
export async function uploadCultivationPhoto(
  farmerId: string,
  harvestId: string,
  localUri: string
): Promise<UploadResult> {
  try {
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    const mimeType = cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const fileName = `evidence-${Date.now()}.${cleanExt}`;
    const filePath = `${farmerId}/${harvestId}/${fileName}`;

    const arrayBuffer = await uriToArrayBuffer(localUri);

    const { data, error } = await supabase.storage
      .from('cultivation-photos')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('[Storage] Error uploading cultivation photo:', error.message);
      return { url: null, path: null, error: error.message };
    }

    // Cultivation bucket is private; create a signed URL (valid for 1 year)
    const { data: signedData, error: signError } = await supabase.storage
      .from('cultivation-photos')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    return {
      url: signedData?.signedUrl || filePath,
      path: filePath,
      error: signError?.message || null,
    };
  } catch (err: any) {
    console.error('[Storage] Exception uploading cultivation photo:', err);
    return {
      url: null,
      path: null,
      error: err.message || 'Failed to upload cultivation photo evidence.',
    };
  }
}

/**
 * Upload a public harvest crop cover image.
 */
export async function uploadHarvestImage(
  farmerId: string,
  harvestId: string,
  localUri: string
): Promise<UploadResult> {
  try {
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    const mimeType = cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const fileName = `crop-${Date.now()}.${cleanExt}`;
    const filePath = `${farmerId}/${harvestId}/${fileName}`;

    const arrayBuffer = await uriToArrayBuffer(localUri);

    const { data, error } = await supabase.storage
      .from('harvest-images')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[Storage] Error uploading harvest image:', error.message);
      return { url: null, path: null, error: error.message };
    }

    const { data: publicData } = supabase.storage.from('harvest-images').getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (err: any) {
    console.error('[Storage] Exception uploading harvest image:', err);
    return {
      url: null,
      path: null,
      error: err.message || 'Failed to upload crop image.',
    };
  }
}

