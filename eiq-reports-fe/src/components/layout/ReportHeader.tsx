'use client';

import { useEffect, useState } from 'react';
import { fetchMeta } from '@/lib/api';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { ReportMeta } from '@/types';

export default function ReportHeader() {
  const reportUrl = useReportUrl();

  const [meta, setMeta] = useState<ReportMeta | null>(null);

  useEffect(() => {
    fetchMeta(reportUrl).then(setMeta).catch(() => null);
  }, [reportUrl]);

  if (!meta?.eventTitle && !meta?.webinarId) return null;

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate" title={meta.eventTitle ?? ''}>
            {meta.eventTitle ?? '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Event / Session Title</p>
        </div>
      </div>
      <div className="flex items-center gap-6 shrink-0 text-right">
        {(meta.webinarRoomId || meta.webinarId) && (
          <div>
            <p className="text-xs font-mono text-gray-500">
              {meta.webinarRoomId ?? meta.webinarId}
            </p>
            <p className="text-xs text-gray-400">Webinar ID</p>
          </div>
        )}
        {meta.generatedAt && (
          <div>
            <p className="text-xs text-gray-500">
              {new Date(meta.generatedAt).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Report Generated</p>
          </div>
        )}
      </div>
    </div>
  );
}
