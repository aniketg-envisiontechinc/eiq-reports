'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchAttendees } from '@/lib/api';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { Attendee, AttendeesResponse } from '@/types';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const columnHelper = createColumnHelper<Attendee>();

function formatTime(val: string | null) {
  if (!val) return <span className="text-gray-300 text-xs">—</span>;
  const d = new Date(val);
  return <span className="text-xs text-gray-600 whitespace-nowrap">{d.toLocaleString()}</span>;
}

function formatSecs(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function DurationCell({ row }: { row: Attendee }) {
  const { durationSeconds, sessions } = row;
  if (!durationSeconds && sessions.length === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  const multiSession = sessions.length > 1;
  return (
    <div className="group relative inline-block">
      <span className={`text-xs text-gray-600 ${multiSession ? 'underline decoration-dotted cursor-help' : ''}`}>
        {formatSecs(durationSeconds)}
        {multiSession && <span className="ml-1 text-brand-500 font-semibold">×{sessions.length}</span>}
      </span>
      {multiSession && (
        <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[240px]">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">
            {sessions.length} sessions · total {formatSecs(durationSeconds)}
          </p>
          <div className="space-y-1">
            {sessions.map((s, i) => (
              <div key={i} className="text-xs text-gray-500 flex justify-between gap-3">
                <span>{s.joinTime ? new Date(s.joinTime).toLocaleTimeString() : '—'} → {s.leaveTime ? new Date(s.leaveTime).toLocaleTimeString() : '—'}</span>
                <span className="text-gray-700 font-medium">{formatSecs(s.durationSeconds)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const REG_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  ACCEPTED: 'success',
  CHECKED_IN: 'success',
  DECLINED: 'warning',
  CANCELED: 'warning',
  NO_RESPONSE: 'default',
};

const REG_STATUS_LABEL: Record<string, string> = {
  NO_RESPONSE: 'No Response',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELED: 'Canceled',
  CHECKED_IN: 'Checked In',
};

const columns = [
  columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: 'name',
    header: 'Name',
    cell: (info) => <span className="font-medium text-gray-900 whitespace-nowrap">{info.getValue()}</span>,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => <span className="text-gray-600 text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor('company', {
    header: 'Company',
    cell: (info) => info.getValue() || <span className="text-gray-300">—</span>,
  }),
  columnHelper.accessor('jobTitle', {
    header: 'Job Title',
    cell: (info) => info.getValue() || <span className="text-gray-300">—</span>,
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: (info) => info.getValue() || <span className="text-gray-300">—</span>,
  }),
  columnHelper.accessor('registrationStatus', {
    header: 'Reg. Status',
    cell: (info) => {
      const val = info.getValue();
      if (!val) return <span className="text-gray-300">—</span>;
      return (
        <Badge variant={REG_STATUS_VARIANT[val] ?? 'default'}>
          {REG_STATUS_LABEL[val] ?? val}
        </Badge>
      );
    },
  }),
  columnHelper.accessor('participantType', {
    header: 'Type',
    cell: (info) => {
      const val = info.getValue();
      if (!val) return <span className="text-gray-300">—</span>;
      return <Badge variant="info">{val}</Badge>;
    },
  }),
  columnHelper.accessor('joinTime', {
    header: 'Join Time',
    cell: (info) => formatTime(info.getValue()),
  }),
  columnHelper.accessor('leaveTime', {
    header: 'Leave Time',
    cell: (info) => formatTime(info.getValue()),
  }),
  columnHelper.display({
    id: 'duration',
    header: 'Duration',
    cell: (info) => <DurationCell row={info.row.original} />,
  }),
  columnHelper.accessor('source', {
    header: 'Source',
    cell: (info) =>
      info.getValue() ? (
        <Badge variant="info">{info.getValue()}</Badge>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  }),
];

export default function AudienceContent() {
  const reportUrl = useReportUrl();

  const [response, setResponse] = useState<AttendeesResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchAttendees(page, 20, search, reportUrl)
      .then(setResponse)
      .finally(() => setLoading(false));
  }, [page, search, reportUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const table = useReactTable({
    data: response?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: response?.totalPages ?? 0,
  });

  const handleExport = () => {
    if (!response) return;
    const headers = [
      'Name', 'Email', 'Company', 'Job Title', 'Country',
      'Reg. Status', 'Type', 'Join Time', 'Leave Time', 'Duration (sec)',
      'Source',
    ];
    const rows = response.data.map((a) => [
      `${a.firstName} ${a.lastName}`,
      a.email,
      a.company,
      a.jobTitle,
      a.country,
      REG_STATUS_LABEL[a.registrationStatus] ?? a.registrationStatus,
      a.participantType,
      a.joinTime ?? '',
      a.leaveTime ?? '',
      String(a.durationSeconds),
      a.source,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendees.csv';
    a.click();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search attendees..."
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={14} />
          Export as CSV
        </button>
      </div>

      {/* Table */}
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
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  No attendees found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {response
            ? `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, response.total)} of ${response.total.toLocaleString()} attendees`
            : ''}
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
            Page {page} of {response?.totalPages ?? 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(response?.totalPages ?? 1, p + 1))}
            disabled={page === (response?.totalPages ?? 1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
