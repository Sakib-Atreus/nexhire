'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Application, ApplicationStatus, Page } from '@/types';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { stageLabel } from './stages';

const MOVE_KEY = ['applications', 'move'];

/**
 * Moves one applicant to another stage with an optimistic update of the job's applicant list.
 * Rolls back and shows a toast on error; refetches once the last in-flight move settles.
 */
export function useMoveApplication(jobId: string) {
  const qc = useQueryClient();
  const listKey = ['applications', 'job', jobId];

  return useMutation({
    mutationKey: MOVE_KEY,
    mutationFn: ({ app, status }: { app: Application; status: ApplicationStatus }) =>
      api.patch<Application>(`/applications/${app.id}/status`, { status }).then((r) => r.data),
    onMutate: async ({ app, status }) => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<Page<Application>>(listKey);
      qc.setQueryData<Page<Application>>(listKey, (old) =>
        old ? { ...old, content: old.content.map((a) => (a.id === app.id ? { ...a, status } : a)) } : old
      );
      return { previousStatus: app.status };
    },
    onSuccess: (_data, { app, status }) => {
      toast.success(`${app.candidateName} moved to ${stageLabel(status)}`);
    },
    onError: (err, { app }, ctx) => {
      // Restore only this applicant so other concurrent moves keep their optimistic state.
      if (ctx) {
        qc.setQueryData<Page<Application>>(listKey, (old) =>
          old ? { ...old, content: old.content.map((a) => (a.id === app.id ? { ...a, status: ctx.previousStatus } : a)) } : old
        );
      }
      toast.error(`Could not move ${app.candidateName}`, getErrorMessage(err));
    },
    onSettled: (_data, _err, { app, status }) => {
      if (qc.isMutating({ mutationKey: MOVE_KEY }) <= 1) {
        qc.invalidateQueries({ queryKey: ['applications'] });
      }
      // Hiring (or un-hiring) can change the job's status (FILLED).
      if (status === 'HIRED' || app.status === 'HIRED') qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
