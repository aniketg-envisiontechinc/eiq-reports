'use client';

import { useEffect, useState } from 'react';
import { fetchChat } from '@/lib/api';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { ChatMessage, ChatResponse } from '@/types';
import { Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

const ROLE_COLORS: Record<string, string> = {
  HOST: 'bg-purple-100 text-purple-700',
  SPEAKER: 'bg-blue-100 text-blue-700',
  ATTENDEE: 'bg-green-100 text-green-700',
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role?.toUpperCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {role}
    </span>
  );
}

export default function ChatContent() {
  const reportUrl = useReportUrl();
  const [data, setData] = useState<ChatResponse>({ totalMessages: 0, messages: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchChat(reportUrl)
      .then((res: ChatResponse) => setData(res))
      .catch(() => setData({ totalMessages: 0, messages: [] }))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportUrl]);

  const totalPages = Math.max(1, Math.ceil(data.messages.length / PAGE_SIZE));
  const paginated = data.messages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    const rows: string[][] = [['Time', 'Sender', 'Email', 'Role', 'Message']];
    data.messages.forEach((m) => {
      rows.push([m.sentAt ?? '', m.senderName, m.senderEmail ?? '', m.senderRole, m.message]);
    });
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_transcript.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  if (data.messages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-400">No chat messages found for this webinar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Chat Transcript
          <span className="ml-2 text-xs font-normal text-gray-400">{data.totalMessages} messages</span>
        </h3>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={14} />
          Export as CSV
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Sender</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((msg: ChatMessage) => (
            <tr key={msg.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top">
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString() : '—'}
              </td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800">{msg.senderName}</p>
                {msg.senderEmail && (
                  <p className="text-xs text-gray-400 mt-0.5">{msg.senderEmail}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={msg.senderRole} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{msg.message}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">{data.messages.length} messages total</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
