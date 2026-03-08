'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, Class } from '@chess/shared';
import { Role } from '@chess/shared';

export default function AdminDashboard() {
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/users') });
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => api.get('/classes') });

  const stats = [
    { label: 'Total Users', value: users.length, icon: '👥' },
    { label: 'Teachers', value: users.filter((u) => u.role === Role.TEACHER).length, icon: '👨‍🏫' },
    { label: 'Students', value: users.filter((u) => u.role === Role.STUDENT).length, icon: '🎓' },
    { label: 'Active Classes', value: classes.length, icon: '🏫' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Recent Users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.slice(0, 10).map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-2">{user.displayName}</td>
                <td className="py-2 text-gray-500">{user.email}</td>
                <td className="py-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
