'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import type { Class, User } from '@chess/shared';
import { Role } from '@chess/shared';

export default function AdminClassesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', teacherId: '' });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes'),
  });

  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ['users', 'teachers'],
    queryFn: () => api.get('/users?role=TEACHER'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setShowCreate(false);
      setForm({ name: '', description: '', teacherId: '' });
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Class
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-lg mb-4">Create Class</h2>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Class name *"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <select
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select teacher *</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.displayName}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || !form.teacherId || createMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/admin/classes/${cls.id}`}
            className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {cls.name}
            </h3>
            {cls.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{cls.description}</p>
            )}
            <p className="text-xs text-gray-400">Teacher: {cls.teacher.displayName}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
