import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'default';
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-blue-100 text-blue-800': variant === 'info',
          'bg-gray-100 text-gray-800': variant === 'default',
        },
      )}
    >
      {children}
    </span>
  );
}
