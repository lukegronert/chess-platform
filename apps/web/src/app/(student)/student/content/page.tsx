'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import type { Assignment } from '@chess/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function StudentContentPage() {
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: () => api.get('/assignments'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/assignments/${id}`, { completedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  async function openPdf(pdfId: string) {
    const { viewUrl } = await api.get<{ viewUrl: string }>(`/pdfs/${pdfId}/view-url`);
    window.open(viewUrl, '_blank');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Assigned Content</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`bg-white rounded-xl shadow-sm border p-4 ${assignment.completedAt ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-2xl">📄</div>
              {assignment.completedAt && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
              )}
            </div>
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{assignment.pdf.title}</h3>
            {assignment.dueAt && (
              <p className="text-xs text-orange-600 mb-1">
                Due: {format(new Date(assignment.dueAt), 'MMM d, yyyy')}
              </p>
            )}
            <p className="text-xs text-gray-400 mb-3">
              Assigned {format(new Date(assignment.assignedAt), 'MMM d, yyyy')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => openPdf(assignment.pdfId)}
                className="flex-1 text-xs bg-blue-50 text-blue-700 py-1.5 rounded hover:bg-blue-100 transition-colors"
              >
                Open
              </button>
              {!assignment.completedAt && (
                <button
                  onClick={() => completeMutation.mutate(assignment.id)}
                  className="text-xs text-green-600 hover:underline"
                >
                  Mark done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {assignments.length === 0 && (
        <p className="text-center text-gray-400 py-16">No assignments yet.</p>
      )}
    </div>
  );
}
