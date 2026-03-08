'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Class, Announcement } from '@chess/shared';

export default function TeacherDashboard() {
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes'),
  });
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements'),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">My Classes</h2>
            <Link href="/teacher/classes" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="font-medium text-sm group-hover:text-blue-600">{cls.name}</p>
                  <p className="text-xs text-gray-400">
                    {(cls as Class & { _count?: { enrollments: number } })._count?.enrollments ?? 0} students
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-blue-400">→</span>
              </Link>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No classes yet</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            {announcements.slice(0, 5).map((ann) => (
              <div key={ann.id} className="border-l-4 border-blue-400 pl-3">
                <p className="font-medium text-sm">{ann.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{ann.body}</p>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No announcements</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
