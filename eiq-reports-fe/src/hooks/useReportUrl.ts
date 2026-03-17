'use client';

import { useSearchParams } from 'next/navigation';
import { decodeReportParam } from '@/lib/reportUrl';

/**
 * Reads the `r` query param (URL-safe base64) and returns the decoded MinIO URL.
 * Returns undefined if the param is absent or decoding fails.
 */
export function useReportUrl(): string | undefined {
  const searchParams = useSearchParams();
  return decodeReportParam(searchParams.get('r')) ?? undefined;
}
