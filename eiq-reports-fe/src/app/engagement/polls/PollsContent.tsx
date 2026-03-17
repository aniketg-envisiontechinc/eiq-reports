'use client';

import { useEffect, useState } from 'react';
import { fetchPolls } from '@/lib/api';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { Poll } from '@/types';
import { Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const PAGE_SIZE = 10;

export default function PollsContent() {
  const reportUrl = useReportUrl();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPolls(reportUrl).then(setPolls).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportUrl]);

  const totalPages = Math.ceil(polls.length / PAGE_SIZE);
  const paginated = polls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    const rows: string[][] = [];
    rows.push(['Question Title', 'Poll Type', 'Options', 'Answered Option : Count']);
    polls.forEach((poll) => {
      const optionsText = poll.options.map((o) => `${o.key.toUpperCase()}: ${o.label}`).join(' | ');
      const answeredText = poll.answeredOptions.map((o) => `${o.label}: ${o.count}`).join(', ');
      rows.push([poll.questionTitle, poll.pollType, optionsText, answeredText]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polls_report.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Polls</h3>
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
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/2">
              Question Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Options
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Answered Option : Count
            </th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((poll) => (
            <tr
              key={poll.id}
              className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top"
            >
              <td className="px-4 py-4">
                <p className="text-sm font-medium text-gray-800">{poll.questionTitle}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={poll.pollType === 'checkbox' ? 'info' : 'default'}>
                    {poll.pollType}
                  </Badge>
                  <span className="text-xs text-gray-400">{poll.totalVotes} votes</span>
                </div>
              </td>
              <td className="px-4 py-4">
                <ul className="space-y-1">
                  {poll.options.map((opt) => (
                    <li key={opt.key} className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-800 uppercase mr-1">{opt.key}:</span>
                      {opt.label}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-4">
                {poll.answeredOptions.length === 0 ? (
                  <span className="text-gray-300 text-xs">No responses</span>
                ) : (
                  <ul className="space-y-1.5">
                    {poll.answeredOptions.map((opt) => (
                      <li key={opt.key} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          {opt.label}:
                        </span>
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                          {opt.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {polls.length} polls total
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-600">
            Page {page} of {totalPages}
          </span>
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
