'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface Props {
  averageRatings: {
    audioVideoQuality: number;
    easeOfUse: number;
    contentRelevance: number;
    presenterEffectiveness: number;
  };
  totalResponses: number;
}

const RATING_LABELS: Record<string, string> = {
  audioVideoQuality: 'A/V Quality',
  easeOfUse: 'Ease of Use',
  contentRelevance: 'Content',
  presenterEffectiveness: 'Presenter',
};

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={i < Math.round(value) ? 'text-amber-400' : 'text-gray-200'}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

export default function FeedbackRatings({ averageRatings, totalResponses }: Props) {
  const radarData = Object.entries(averageRatings).map(([key, value]) => ({
    subject: RATING_LABELS[key] || key,
    value: value,
    fullMark: 5,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Audience Feedback</h3>
        <span className="text-xs text-gray-400">{totalResponses} responses</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
        {Object.entries(averageRatings).map(([key, value]) => (
          <div key={key}>
            <p className="text-xs text-gray-500 mb-1">{RATING_LABELS[key] || key}</p>
            <StarRating value={value} />
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#f0f0f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
          <Radar
            name="Rating"
            dataKey="value"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.2}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(v: number) => [v.toFixed(1) + ' / 5', 'Avg Rating']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
