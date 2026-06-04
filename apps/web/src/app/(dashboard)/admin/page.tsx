'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Page, User } from '@/types';
import { Users, ShieldCheck } from 'lucide-react';

export default function AdminPage() {
  const { data } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<Page<User>>('/users').then((r) => r.data),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <Users className="w-6 h-6 text-primary-500 mb-2" />
          <p className="text-3xl font-bold text-slate-900">{data?.totalElements ?? '-'}</p>
          <p className="text-slate-500 text-sm mt-1">Total Users</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Role</th>
                <th className="text-left px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.content.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{user.fullName}</td>
                  <td className="px-6 py-3 text-slate-500">{user.email}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
