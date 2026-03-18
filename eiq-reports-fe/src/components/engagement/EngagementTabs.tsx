'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { MessageSquare, BarChart2, MessagesSquare } from 'lucide-react';

const tabs = [
  { label: 'Q&A', href: '/engagement/qna', icon: MessageSquare },
  { label: 'Polls', href: '/engagement/polls', icon: BarChart2 },
  { label: 'Chat', href: '/engagement/chat', icon: MessagesSquare },
];

export default function EngagementTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const r = searchParams.get('r');

  const tabHref = (base: string) => (r ? `${base}?r=${r}` : base);

  return (
    <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-100 p-1.5 shadow-sm w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tabHref(tab.href)}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
