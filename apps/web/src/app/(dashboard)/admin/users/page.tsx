'use client';

import { useState } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import { useAllUsers, useBanUser, usePromoteUser } from '@/hooks/useUsers';
import type { Role } from '@/types';

const ROLES: Role[] = ['CANDIDATE', 'RECRUITER', 'ADMIN'];

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAllUsers(page, 20);
  const banUser = useBanUser();
  const promoteUser = usePromoteUser();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
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
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading users...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Role</th>
                  <th className="text-left px-6 py-3">Joined</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.content.map((user) => {
                  const isBanning =
                    banUser.isPending &&
                    (banUser.variables as { id: string } | undefined)?.id === user.id;
                  const isPromoting =
                    promoteUser.isPending &&
                    (promoteUser.variables as { id: string } | undefined)?.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50 transition-opacity ${
                        user.enabled === false ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-6 py-3 font-medium text-slate-800">{user.fullName}</td>
                      <td className="px-6 py-3 text-slate-500">{user.email}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            disabled={isPromoting}
                            onChange={(e) =>
                              promoteUser.mutate({ id: user.id, role: e.target.value as Role })
                            }
                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          {isPromoting && (
                            <svg
                              className="w-4 h-4 animate-spin text-primary-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        {user.enabled === false ? (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {user.enabled === false ? (
                          <button
                            disabled={isBanning}
                            onClick={() => banUser.mutate({ id: user.id, enabled: true })}
                            className="text-xs px-3 py-1 rounded border border-green-500 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                          >
                            {isBanning ? 'Updating...' : 'Unban'}
                          </button>
                        ) : (
                          <button
                            disabled={isBanning}
                            onClick={() => banUser.mutate({ id: user.id, enabled: false })}
                            className="text-xs px-3 py-1 rounded border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {isBanning ? 'Updating...' : 'Ban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {data.number + 1} of {data.totalPages} &mdash; {data.totalElements} users
            </p>
            <div className="flex gap-2">
              <button
                disabled={data.first}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="text-xs px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
