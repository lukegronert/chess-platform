'use client';

import { CurriculumBuilder } from '@/components/curriculum/CurriculumBuilder';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { CurriculumItemType } from '@chess/shared';
import type { Class } from '@chess/shared';

interface PageProps {
  params: { id: string };
}

export default function CurriculumPage({ params }: PageProps) {
  const { id } = params;
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: CurriculumItemType.PDF, externalUrl: '', textContent: '' });

  const { data: cls } = useQuery<Class>({ queryKey: ['class', id], queryFn: () => api.get(`/classes/${id}`) });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post(`/classes/${id}/curriculum`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum', id] });
      setShowAdd(false);
      setForm({ title: '', description: '', type: CurriculumItemType.PDF, externalUrl: '', textContent: '' });
    },
  });

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum</h1>
          {cls && <p className="text-gray-500 text-sm mt-1">{cls.name}</p>}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Item
        </button>
      </div>

      <CurriculumBuilder classId={id} />

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-lg mb-4">Add Curriculum Item</h2>
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title *"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CurriculumItemType })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value={CurriculumItemType.PDF}>PDF</option>
                <option value={CurriculumItemType.EXTERNAL_LINK}>External Link</option>
                <option value={CurriculumItemType.TEXT_NOTE}>Text Note</option>
                <option value={CurriculumItemType.GAME_REPLAY}>Game Replay</option>
              </select>
              {form.type === CurriculumItemType.EXTERNAL_LINK && (
                <input
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  placeholder="URL"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
              {form.type === CurriculumItemType.TEXT_NOTE && (
                <textarea
                  value={form.textContent}
                  onChange={(e) => setForm({ ...form, textContent: e.target.value })}
                  placeholder="Note content"
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.title || createMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button onClick={() => setShowAdd(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
