import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={null}><Header /></Suspense>
      <main className="pt-16 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Post webinar performance overview</p>
        </div>
        <DashboardContent />
      </main>
    </>
  );
}
