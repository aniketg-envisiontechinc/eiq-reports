'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard, fetchFeedback } from '@/lib/api';
import { useReportUrl } from '@/hooks/useReportUrl';
import type { DashboardStats, FeedbackResponse } from '@/types';
import StatCard from '@/components/ui/StatCard';
import RegistrationTimeline from '@/components/dashboard/RegistrationTimeline';
import RegistrationSource from '@/components/dashboard/RegistrationSource';
import FeedbackRatings from '@/components/dashboard/FeedbackRatings';
import { Loader2 } from 'lucide-react';

export default function DashboardContent() {
  const reportUrl = useReportUrl();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDashboard(reportUrl), fetchFeedback(reportUrl)])
      .then(([dashData, feedData]) => {
        setStats(dashData);
        setFeedback(feedData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={stats.totalRegistrants.toLocaleString()} label="Total Registrants" />
        <StatCard value={stats.totalAttendees.toLocaleString()} label="Total Attendees" />
        <StatCard value={`${stats.conversionRate}%`} label="Attendee Conversion Rate" accent />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Event Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Event Summary</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Event Duration</dt>
              <dd className="font-medium text-gray-800">{stats.eventDurationMin} Min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Questions Asked</dt>
              <dd className="font-medium text-gray-800">{stats.questionsAsked}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Poll Questions Answered</dt>
              <dd className="font-medium text-gray-800">{stats.pollQuestionsAnswered}</dd>
            </div>
          </dl>
        </div>

        {/* Live Performance */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Live Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalRegistrants.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Registrants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAttendees.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Attendees</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">{stats.conversionRate}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Attendee Conversion Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgMinutesViewed} min</p>
              <p className="text-xs text-gray-500 mt-0.5">Avg. Minutes Viewed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <RegistrationTimeline data={stats.registrationTimeline} />
        <RegistrationSource data={stats.registrationSource} />
      </div>

      {/* Feedback + On-Demand */}
      <div className="grid grid-cols-2 gap-4">
        {feedback && (
          <FeedbackRatings
            averageRatings={feedback.averageRatings}
            totalResponses={feedback.totalResponses}
          />
        )}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">On-Demand Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.onDemandRegistrants}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Registrants</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.onDemandVideoPlays}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Video Plays</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">
            On-demand data will be available after video processing is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
