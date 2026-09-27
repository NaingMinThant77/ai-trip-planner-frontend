import { UploadedCoverImage } from '../types/api';
import { api } from './client';

/**
 * Both routes return a Cloudinary url+publicId *before* a trip exists — the New Trip form
 * calls one of these first, then passes the result straight into CreateTripInput.coverImageUrl.
 */
export async function uploadTripCoverImage(input: {
  uri: string;
  fileName: string;
  mimeType: string;
}): Promise<UploadedCoverImage> {
  const form = new FormData();
  form.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob);

  const { data } = await api.post<UploadedCoverImage>('/trips/cover-image/upload', form, {
    headers: { 'Content-Type': undefined },
    transformRequest: (value) => value,
  });

  return data;
}

export async function generateTripCoverImage(destination: string): Promise<UploadedCoverImage> {
  // Must outlast the backend's 100s wait on the free image generator's queue.
  const { data } = await api.post<UploadedCoverImage>(
    '/trips/cover-image/generate',
    { destination },
    { timeout: 120_000 },
  );
  return data;
}
