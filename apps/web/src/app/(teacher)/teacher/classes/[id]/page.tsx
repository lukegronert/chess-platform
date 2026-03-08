'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import type { Class, ClassEnrollment, ClassGroup } from '@chess/shared';

interface PageProps {
  params: { id: string };
}

export default function TeacherClassPage({ params }: PageProps) {
  const { id } = params;
  const queryClient = useQueryClient();
  const [studentIdInput, setStudentIdInput] = useState('');
  const [groupName, setGroupName] = useState('');

  const { data: cls } = useQuery<Class>({
    queryKey: ['class', id],
    queryFn: () => api.get(`/classes/${id}`),
  });
  const { data: enrollments = [] } = useQuery<ClassEnrollment[]>({
    queryKey: ['enrollments', id],
    queryFn: () => api.get(`/classes/${id}/enrollments`),
  });
  const { data: groups = [] } = useQuery<ClassGroup[]>({
    queryKey: ['groups', id],
    queryFn: () => api.get(`/classes/${id}/groups`),
  });

  const enrollMutation = useMutation({
    mutationFn: (studentId: string) => api.post(`/classes/${id}/enrollments`, { studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', id] });
      setStudentIdInput('');
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (studentId: string) => api.delete(`/classes/${id}/enrollments/${studentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments', id] }),
  });

  const createGroupMutation = useMutation({
    mutationFn: (name: string) => api.post(`/classes/${id}/groups`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', id] });
      setGroupName('');
    },
  });

  if (!cls) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
          {cls.description && <p className="text-gray-500 mt-1">{cls.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/teacher/classes/${id}/curriculum`}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Curriculum
          </Link>
          <Link
            href={`/teacher/classes/${id}/board`}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Class Board
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roster */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Roster ({enrollments.length} students)
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              placeholder="Student ID"
              className="flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => enrollMutation.mutate(studentIdInput)}
              disabled={!studentIdInput || enrollMutation.isPending}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Enroll
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1">
                <div>
                  <p className="font-medium">{e.student.displayName}</p>
                  <p className="text-gray-400 text-xs">{e.student.email}</p>
                </div>
                <button
                  onClick={() => unenrollMutation.mutate(e.studentId)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Groups</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => createGroupMutation.mutate(groupName)}
              disabled={!groupName || createGroupMutation.isPending}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </div>
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="border rounded-lg p-3">
                <Link
                  href={`/teacher/classes/${id}/groups/${group.id}`}
                  className="font-medium text-sm hover:text-blue-600 transition-colors"
                >
                  {group.name}
                </Link>
                <p className="text-xs text-gray-400">{group.members.length} members</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
