import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import EngagementTabs from '@/components/engagement/EngagementTabs';
import QnaContent from './QnaContent';

export const dynamic = 'force-dynamic';

export default function QnaPage() {
  return (
    <>
      <Suspense fallback={null}><Header /></Suspense>
      <main className="pt-16 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Engagement</h2>
          <p className="text-sm text-gray-500 mt-0.5">Questions, polls and chat interactions</p>
        </div>
        <EngagementTabs />
        <QnaContent />
      </main>
    </>
  );
}
