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
 * Converts a base64 string directly into an ArrayBuffer for cross-platform
 * binary upload to Supabase Storage (bypassing flaky mobile file:// fetch streams).
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;

  if (typeof atob === 'function') {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let bufferLength = clean.length * 0.75;
  if (clean.endsWith('==')) bufferLength -= 2;
  else if (clean.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = chars.indexOf(clean[i]);
    const e2 = chars.indexOf(clean[i + 1]);
    const e3 = chars.indexOf(clean[i + 2]);
    const e4 = chars.indexOf(clean[i + 3]);

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 !== 64 && e3 !== -1) {
      bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    }
    if (e4 !== 64 && e4 !== -1) {
      bytes[p++] = ((e3 & 3) << 6) | e4;
    }
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Upload an avatar image for a user.
 * Conforms to storage RLS policy: folder name must equal auth.uid().
 */
export async function uploadAvatar(
  userId: string,
  localUri: string,
  base64Data?: string
): Promise<UploadResult> {
  try {
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    const mimeType = cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const fileName = `avatar-${Date.now()}.${cleanExt}`;
    const filePath = `${userId}/${fileName}`;

    let arrayBuffer: ArrayBuffer;
    if (base64Data) {
      arrayBuffer = base64ToArrayBuffer(base64Data);
    } else {
      arrayBuffer = await uriToArrayBuffer(localUri);
    }

    const { error } = await supabase.storage
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

    const { error } = await supabase.storage
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

    const { error } = await supabase.storage
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

/**
 * Upload a public supplier catalogue product image.
 * Uses the 'catalogue-images' bucket with path `{supplierId}/{itemId}/{timestamp}.jpg`
 */
export async function uploadCatalogueImage(
  supplierId: string,
  itemId: string,
  localUri: string,
  base64Data?: string
): Promise<UploadResult> {
  try {
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    const mimeType = cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const fileName = `item-${Date.now()}.${cleanExt}`;
    const filePath = `${supplierId}/${itemId}/${fileName}`;

    let arrayBuffer: ArrayBuffer;
    if (base64Data) {
      arrayBuffer = base64ToArrayBuffer(base64Data);
    } else {
      arrayBuffer = await uriToArrayBuffer(localUri);
    }

    const { error } = await supabase.storage
      .from('catalogue-images')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[Storage] Error uploading catalogue image:', error.message);
      return { url: null, path: null, error: error.message };
    }

    const { data: publicData } = supabase.storage.from('catalogue-images').getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (err: any) {
    console.error('[Storage] Exception uploading catalogue image:', err);
    return {
      url: null,
      path: null,
      error: err.message || 'Failed to upload catalogue image.',
    };
  }
}

