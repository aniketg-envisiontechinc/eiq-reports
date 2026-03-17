'use client';

import { useEffect, useState } from 'react';
import { fetchMeta } from '@/lib/api';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { ReportMeta } from '@/types';

export default function Header() {
  const reportUrl = useReportUrl();
  const [meta, setMeta] = useState<ReportMeta | null>(null);

  useEffect(() => {
    fetchMeta(reportUrl).then(setMeta).catch(() => null);
  }, [reportUrl]);

  const title = meta?.eventTitle ?? '—';
  const subtitle = meta?.webinarRoomId ?? meta?.webinarId ?? '—';

  return (
    <header className="h-16 bg-brand-800 text-white flex items-center justify-between px-6 fixed top-0 left-56 right-0 z-20 shadow-sm">
      <div>
        <h1 className="text-sm font-semibold">{title}</h1>
        <p className="text-xs text-brand-200">Webinar ID: {subtitle}</p>
      </div>
      <span className="text-sm font-bold tracking-wider text-brand-100">
        DCT INTELLIGENCE
      </span>
    </header>
  );
}
