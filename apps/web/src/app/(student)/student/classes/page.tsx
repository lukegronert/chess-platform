'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Class } from '@chess/shared';

export default function StudentClassesPage() {
  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes'),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/student/classes/${cls.id}`}
            className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {cls.name}
            </h3>
            {cls.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{cls.description}</p>
            )}
            <p className="text-xs text-gray-400">Teacher: {cls.teacher.displayName}</p>
          </Link>
        ))}
        {classes.length === 0 && (
          <p className="text-gray-400 col-span-3 text-center py-16">
            You are not enrolled in any classes yet.
          </p>
        )}
      </div>
    </div>
  );
}
