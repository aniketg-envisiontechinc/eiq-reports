'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart2,
  MessagesSquare,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Audience',  href: '/audience',  icon: Users },
  {
    label: 'Engagement',
    icon: MessagesSquare,
    children: [
      { label: 'Q&A',   href: '/engagement/qna',   icon: MessageSquare },
      { label: 'Polls', href: '/engagement/polls',  icon: BarChart2 },
      { label: 'Chat',  href: '/engagement/chat',   icon: MessagesSquare },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const r = searchParams.get('r') ?? undefined;

  const [engagementOpen, setEngagementOpen] = useState(
    pathname.startsWith('/engagement'),
  );

  const href = (base: string) => (r ? `${base}?r=${r}` : base);

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-sidebar flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <span className="text-white font-bold text-base tracking-wide">
          DCT INTELLIGENCE
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            const isActive = pathname.startsWith('/engagement');
            return (
              <div key={item.label}>
                <button
                  onClick={() => setEngagementOpen((o) => !o)}
                  className={clsx(
                    'sidebar-link w-full justify-between',
                    isActive ? 'active' : 'inactive',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={18} />
                    {item.label}
                  </span>
                  {engagementOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {engagementOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={href(child.href)}
                        className={clsx(
                          'sidebar-link',
                          pathname === child.href ? 'active' : 'inactive',
                        )}
                      >
                        <child.icon size={16} />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={href(item.href!)}
              className={clsx('sidebar-link', pathname === item.href ? 'active' : 'inactive')}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-xs text-slate-400">EngageIQ Reports</p>
      </div>
    </aside>
  );
}
