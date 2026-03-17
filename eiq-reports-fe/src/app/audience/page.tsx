import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import AudienceContent from './AudienceContent';

export const dynamic = 'force-dynamic';

export default function AudiencePage() {
  return (
    <>
      <Suspense fallback={null}><Header /></Suspense>
      <main className="pt-16 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Audience</h2>
          <p className="text-sm text-gray-500 mt-0.5">Registrant and attendee details</p>
        </div>
        <AudienceContent />
      </main>
    </>
  );
}
