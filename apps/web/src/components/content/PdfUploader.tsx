'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadUrlResponse } from '@chess/shared';

interface PdfUploaderProps {
  classId?: string;
  onSuccess?: () => void;
}

export function PdfUploader({ classId, onSuccess }: PdfUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !title) throw new Error('File and title required');

      // Step 1: Get signed upload URL
      const { uploadUrl, r2Key } = await api.post<UploadUrlResponse>('/pdfs/upload-url', {
        contentType: 'application/pdf',
        filename: selectedFile.name,
      });

      // Step 2: Upload directly to R2 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => (xhr.status < 300 ? resolve() : reject(new Error('Upload failed'))));
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', 'application/pdf');
        xhr.send(selectedFile);
      });

      // Step 3: Persist metadata
      await api.post('/pdfs', {
        title,
        description: description || undefined,
        r2Key,
        fileSize: selectedFile.size,
        classId,
      });
    },
    onSuccess: () => {
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setProgress(null);
      queryClient.invalidateQueries({ queryKey: ['pdfs'] });
      onSuccess?.();
    },
    onError: () => setProgress(null),
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') setSelectedFile(file);
  }, []);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onClick={() => document.getElementById('pdf-file-input')?.click()}
      >
        {selectedFile ? (
          <p className="text-sm text-green-700 font-medium">{selectedFile.name}</p>
        ) : (
          <p className="text-sm text-gray-500">Drag & drop a PDF here, or click to browse</p>
        )}
        <input
          id="pdf-file-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title *"
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
      />

      {progress !== null && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <button
        onClick={() => uploadMutation.mutate()}
        disabled={!selectedFile || !title || uploadMutation.isPending}
        className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {uploadMutation.isPending ? 'Uploading...' : 'Upload PDF'}
      </button>
    </div>
  );
}
