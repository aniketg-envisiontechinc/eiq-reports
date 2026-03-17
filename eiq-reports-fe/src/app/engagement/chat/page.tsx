import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import EngagementTabs from '@/components/engagement/EngagementTabs';
import { MessagesSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ChatPage() {
  return (
    <>
      <Suspense fallback={null}><Header /></Suspense>
      <main className="pt-16 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Engagement</h2>
          <p className="text-sm text-gray-500 mt-0.5">Questions, polls and chat interactions</p>
        </div>
        <EngagementTabs />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessagesSquare size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">Chat Report Coming Soon</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Chat transcript data will be available here once the chat report builder is connected.
          </p>
        </div>
      </main>
    </>
  );
}
