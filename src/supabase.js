import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://brqvinydqpbqfjurivgc.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycXZpbnlkcXBicWZqdXJpdmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyNzUsImV4cCI6MjEwMzY2NzI3NX0.lakQoZWJ8O9MaUM6j5P-yL33dJNOQMr6aEJ4he2ZCXQ";
export const SUPABASE_BUCKET = "recordings";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Returns public URL for video recordings stored in Supabase
 * Path format: recordings/<userId>/<YYYY-MM-DD>/<fileName>.mp4
 * Example: https://brqvinydqpbqfjurivgc.supabase.co/storage/v1/object/public/recordings/wWyNv6uQ5jhXNaAgamcAj8B4rMV2/2026-08-30/sos_193858_back.mp4
 */
export function getPublicVideoUrl(userId, dateStr, fileName) {
  if (!userId || !dateStr || !fileName) return '';
  const path = `${userId}/${dateStr}/${fileName}`;
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
}

/**
 * Returns public URL for profile photo in Supabase
 * Path format: recordings/profile_photos/<userId>.jpg
 * Example: https://brqvinydqpbqfjurivgc.supabase.co/storage/v1/object/public/recordings/profile_photos/<userId>.jpg
 */
export function getPublicProfilePhotoUrl(userId) {
  if (!userId) return '';
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/profile_photos/${userId}.jpg`;
}

/**
 * Resolves any media storage path or URL to a public Supabase URL
 */
export function resolveMediaUrl(pathOrUrl, userId = '') {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') {
    return userId ? getPublicProfilePhotoUrl(userId) : '';
  }
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  // Strip leading 'recordings/' if present in path string
  const cleanPath = pathOrUrl.replace(/^recordings\//, '');
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${cleanPath}`;
}
