'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchPolls, fetchPollExport } from '@/lib/api';
import { downloadCsv, downloadPollsXlsx } from '@/lib/exportUtils';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { Poll, PollExportData } from '@/types';
import { Download, ChevronDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const PAGE_SIZE = 10;

type ExportFormat = 'csv' | 'xlsx';

export default function PollsContent() {
  const reportUrl = useReportUrl();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPolls(reportUrl).then(setPolls).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalPages = Math.ceil(polls.length / PAGE_SIZE);
  const paginated = polls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /**
   * Build CSV export rows (headers + data rows).
   *   - If respondent data is available: per-respondent pivot table.
   *   - Fallback: aggregated summary from the report JSON.
   */
  const buildCsvRows = async (): Promise<string[][]> => {
    if (reportUrl) {
      try {
        const data: PollExportData = await fetchPollExport(reportUrl);
        if (data.respondents.length > 0) {
          const headers = [
            'Email', 'First Name', 'Last Name', 'Company',
            ...data.questions.map((q) => q.question),
          ];
          const rows = data.respondents.map((r) => [
            r.email,
            r.firstName,
            r.lastName,
            r.company,
            ...data.questions.map((q) => r.answers[q.id] ?? ''),
          ]);
          return [headers, ...rows];
        }
      } catch {
        // fall through to aggregated export
      }
    }

    // Aggregated summary fallback
    const headers = ['Question Title', 'Poll Type', 'Options', 'Answered Option : Count'];
    const rows = polls.map((poll) => {
      const optionsText = poll.options.map((o) => `${o.key.toUpperCase()}: ${o.label}`).join(' | ');
      const answeredText = poll.answeredOptions.map((o) => `${o.label}: ${o.count}`).join(', ');
      return [poll.questionTitle, poll.pollType, optionsText, answeredText];
    });
    return [headers, ...rows];
  };

  const handleExport = async (format: ExportFormat) => {
    setMenuOpen(false);
    setExporting(true);
    try {
      if (format === 'xlsx') {
        // XLSX: dual-layout — poll summary with % on left, respondent list + answers on right
        let questions: PollExportData['questions'] = [];
        let respondents: PollExportData['respondents'] = [];
        if (reportUrl) {
          try {
            const data: PollExportData = await fetchPollExport(reportUrl);
            questions = data.questions;
            respondents = data.respondents;
          } catch {
            // respondents stays empty — poll summary still exports
          }
        }
        const pollSummaries = polls.map((p) => ({
          questionTitle: p.questionTitle,
          totalVotes: p.totalVotes,
          options: p.options.map((o) => ({ label: o.label, count: o.count })),
        }));
        await downloadPollsXlsx(pollSummaries, questions, respondents, 'polls_report.xlsx');
      } else {
        // CSV: flat per-respondent rows
        const rows = await buildCsvRows();
        downloadCsv(rows, 'polls_report.csv');
      }
    } finally {
      setExporting(false);
    }
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

        {/* Export split-button dropdown */}
        <div className="relative" ref={menuRef}>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {exporting ? 'Exporting…' : 'Export as CSV'}
            </button>
            <div className="w-px h-full bg-gray-200 self-stretch" />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={exporting}
              className="px-2 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="More export options"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                Download as CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                Download as XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/3">
              Question Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Options
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Answered Option : Count
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Respondents
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
              <td className="px-4 py-4">
                {!poll.respondentEmails || poll.respondentEmails.length === 0 ? (
                  <span className="text-gray-300 text-xs">—</span>
                ) : (
                  <p className="text-xs text-gray-600 break-all" title={poll.respondentEmails.join(', ')}>
                    {poll.respondentEmails.join(', ')}
                  </p>
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
