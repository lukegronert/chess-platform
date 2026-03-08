'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Class, Announcement } from '@chess/shared';

interface PageProps {
  params: { id: string };
}

export default function StudentClassPage({ params }: PageProps) {
  const { id } = params;

  const { data: cls } = useQuery<Class>({
    queryKey: ['class', id],
    queryFn: () => api.get(`/classes/${id}`),
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements'),
  });

  const classAnnouncements = announcements.filter((a) => a.classId === id);

  if (!cls) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{cls.name}</h1>
      {cls.description && <p className="text-gray-500 mb-6">{cls.description}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Lessons', icon: '📚', href: `/student/classes/${id}/lessons`, desc: 'View curriculum' },
          { label: 'Class Board', icon: '💬', href: `/student/classes/${id}/board`, desc: 'Class discussion' },
        ].map(({ label, icon, href, desc }) => (
          <Link key={label} href={href} className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-2">{icon}</div>
            <p className="font-semibold group-hover:text-blue-600 transition-colors">{label}</p>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      {classAnnouncements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Class Announcements</h2>
          <div className="space-y-3">
            {classAnnouncements.map((ann) => (
              <div key={ann.id} className="border-l-4 border-blue-400 pl-3">
                <p className="font-medium text-sm">{ann.title}</p>
                <p className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{ann.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
