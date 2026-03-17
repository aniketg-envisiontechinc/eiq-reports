'use client';

import { useEffect, useState } from 'react';
import { fetchQna } from '@/lib/api';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { QnaResponse, QnaQuestion } from '@/types';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Download, Loader2, CheckCircle, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const columnHelper = createColumnHelper<QnaQuestion>();

const columns = [
  columnHelper.accessor('participantName', {
    header: 'User Name',
    cell: (info) => (
      <span className="font-medium text-gray-900 whitespace-nowrap">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('participantEmail', {
    header: 'User Email',
    cell: (info) => <span className="text-xs text-gray-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('question', {
    header: 'Question',
    cell: (info) => (
      <p className="text-sm text-gray-700 max-w-sm">{info.getValue()}</p>
    ),
  }),
  columnHelper.accessor('answer', {
    header: 'Answer',
    cell: (info) => {
      const val = info.getValue();
      if (!val) return <span className="text-gray-300 text-xs">—</span>;
      return <p className="text-sm text-gray-600 max-w-xs">{val}</p>;
    },
  }),
  columnHelper.accessor('isAnswered', {
    header: 'Status',
    cell: (info) =>
      info.getValue() ? (
        <Badge variant="success">Answered</Badge>
      ) : (
        <Badge variant="default">Unanswered</Badge>
      ),
  }),
  columnHelper.accessor('answerDetails', {
    header: 'Answerer Name',
    cell: (info) => {
      const details = info.getValue();
      if (!details || details.length === 0)
        return <span className="text-gray-300 text-xs">—</span>;
      return <span className="text-xs text-gray-600">{details[0].answeredBy}</span>;
    },
  }),
  columnHelper.accessor('answerDetails', {
    id: 'answererEmail',
    header: 'Answerer Email',
    cell: (info) => {
      const details = info.getValue();
      if (!details || details.length === 0)
        return <span className="text-gray-300 text-xs">—</span>;
      return <span className="text-xs text-gray-500">{details[0].answeredByEmail}</span>;
    },
  }),
  columnHelper.accessor('status', {
    header: 'Answer Type',
    cell: (info) => (
      <Badge variant="info">{info.getValue()}</Badge>
    ),
  }),
];

export default function QnaContent() {
  const reportUrl = useReportUrl();

  const [data, setData] = useState<QnaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    fetchQna(reportUrl).then(setData).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportUrl]);

  const table = useReactTable({
    data: data?.questions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
  });

  const handleExport = () => {
    if (!data) return;
    const headers = ['User Name', 'User Email', 'Question', 'Answer', 'Status', 'Answered By', 'Answerer Email'];
    const rows = data.questions.map((q) => [
      q.participantName,
      q.participantEmail,
      q.question,
      q.answer || '',
      q.isAnswered ? 'Answered' : 'Unanswered',
      q.answerDetails[0]?.answeredBy || '',
      q.answerDetails[0]?.answeredByEmail || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qna_report.csv';
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
    <div className="space-y-4">
      {/* Stats bar */}
      {data && (
        <div className="flex gap-4">
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 shadow-sm flex items-center gap-3">
            <CheckCircle size={16} className="text-green-500" />
            <div>
              <p className="text-lg font-bold text-gray-900">{data.answeredCount}</p>
              <p className="text-xs text-gray-500">Answered</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 shadow-sm flex items-center gap-3">
            <Clock size={16} className="text-gray-400" />
            <div>
              <p className="text-lg font-bold text-gray-900">{data.unansweredCount}</p>
              <p className="text-xs text-gray-500">Unanswered</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 shadow-sm flex items-center gap-3">
            <div>
              <p className="text-lg font-bold text-gray-900">{data.totalQuestions}</p>
              <p className="text-xs text-gray-500">Total Questions</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Questions &amp; Answers</h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Download size={14} />
            Export as CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-gray-50 border-b border-gray-100">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
