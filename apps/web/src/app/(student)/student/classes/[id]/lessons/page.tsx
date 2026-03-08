'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CurriculumItemType } from '@chess/shared';
import type { CurriculumItem } from '@chess/shared';

interface PageProps {
  params: { id: string };
}

const typeIcons: Record<CurriculumItemType, string> = {
  [CurriculumItemType.PDF]: '📄',
  [CurriculumItemType.GAME_REPLAY]: '♟',
  [CurriculumItemType.EXTERNAL_LINK]: '🔗',
  [CurriculumItemType.TEXT_NOTE]: '📝',
};

export default function StudentLessonsPage({ params }: PageProps) {
  const { id } = params;

  const { data: items = [] } = useQuery<CurriculumItem[]>({
    queryKey: ['curriculum', id],
    queryFn: () => api.get(`/classes/${id}/curriculum`),
  });

  const published = items.filter((i) => i.isPublished);

  async function openPdf(pdfId: string) {
    const { viewUrl } = await api.get<{ viewUrl: string }>(`/pdfs/${pdfId}/view-url`);
    window.open(viewUrl, '_blank');
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lessons</h1>
      <div className="space-y-3">
        {published.map((item, idx) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-start gap-4">
            <div className="text-2xl shrink-0 mt-0.5">{typeIcons[item.type]}</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{idx + 1}. {item.title}</p>
              {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
              {item.textContent && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{item.textContent}</p>
              )}
            </div>
            <div className="shrink-0">
              {item.type === CurriculumItemType.PDF && item.pdfId && (
                <button
                  onClick={() => openPdf(item.pdfId!)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Open PDF
                </button>
              )}
              {item.type === CurriculumItemType.EXTERNAL_LINK && item.externalUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Open Link
                </a>
              )}
            </div>
          </div>
        ))}
        {published.length === 0 && (
          <p className="text-center text-gray-400 py-16">No lessons published yet.</p>
        )}
      </div>
    </div>
  );
}
