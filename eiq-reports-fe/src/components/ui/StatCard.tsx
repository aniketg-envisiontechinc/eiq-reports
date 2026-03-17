import clsx from 'clsx';

interface StatCardProps {
  value: string | number;
  label: string;
  accent?: boolean;
  className?: string;
}

export default function StatCard({ value, label, accent, className }: StatCardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-100 p-5 shadow-sm', className)}>
      <p className={clsx('text-3xl font-bold', accent ? 'text-brand-600' : 'text-gray-900')}>
        {value}
      </p>
      <p className="text-sm text-brand-500 font-medium mt-1">{label}</p>
    </div>
  );
}
