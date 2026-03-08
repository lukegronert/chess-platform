'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PdfUploader } from '@/components/content/PdfUploader';
import { useState } from 'react';
import type { Pdf } from '@chess/shared';
import { format } from 'date-fns';

export default function TeacherContentPage() {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data: pdfs = [] } = useQuery<Pdf[]>({
    queryKey: ['pdfs'],
    queryFn: () => api.get('/pdfs'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pdfs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pdfs'] }),
  });

  async function openPdf(pdfId: string) {
    const { viewUrl } = await api.get<{ viewUrl: string }>(`/pdfs/${pdfId}/view-url`);
    window.open(viewUrl, '_blank');
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showUpload ? 'Cancel' : '+ Upload PDF'}
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 max-w-lg">
          <PdfUploader onSuccess={() => setShowUpload(false)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdfs.map((pdf) => (
          <div key={pdf.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-3xl mb-2">📄</div>
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{pdf.title}</h3>
            {pdf.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{pdf.description}</p>
            )}
            <p className="text-xs text-gray-400 mb-3">
              {format(new Date(pdf.createdAt), 'MMM d, yyyy')} ·{' '}
              {(pdf.fileSize / 1024).toFixed(0)} KB
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => openPdf(pdf.id)}
                className="flex-1 text-xs bg-blue-50 text-blue-700 py-1.5 rounded hover:bg-blue-100 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => deleteMutation.mutate(pdf.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {pdfs.length === 0 && !showUpload && (
        <p className="text-center text-gray-400 py-16">No PDFs uploaded yet. Click Upload PDF to get started.</p>
      )}
    </div>
  );
}
