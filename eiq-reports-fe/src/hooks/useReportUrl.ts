'use client';

import { useSearchParams } from 'next/navigation';
import { decodeReportParam } from '@/lib/reportUrl';

/**
 * Reads the `r` query param (URL-safe base64) and returns the decoded MinIO URL.
 * Returns undefined if the param is absent or decoding fails.
 */
export function useReportUrl(): string | undefined {
  const searchParams = useSearchParams();
  const decoded = decodeReportParam(searchParams.get('r'));
  if (!decoded) return undefined;

  // If decoded is a relative path, prepend the S3 base URL + bucket
  if (decoded.startsWith('/')) {
    const base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? '';
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME ?? '';
    return `${base}/${bucket}${decoded}`;
  }

  return decoded;
}
