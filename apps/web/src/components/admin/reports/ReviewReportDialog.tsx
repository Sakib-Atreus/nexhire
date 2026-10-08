'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import type { JobReport } from '@/types';

export type ReviewMode = 'hide' | 'resolve' | 'dismiss';

const MAX_NOTE = 1000;

const COPY: Record<ReviewMode, { title: string; confirm: string; tone: 'danger' | 'primary'; body: (r: JobReport) => string }> = {
  hide: {
    title: 'Hide job and resolve report?',
    confirm: 'Hide job & resolve',
    tone: 'danger',
    body: (r) =>
      `“${r.jobTitle}” at ${r.companyName} will be hidden from candidates. ${
        r.openReportsForJob > 1 ? 'Other open reports for this job stay open until you review them. ' : ''
      }You can unhide it later from Jobs.`,
  },
  resolve: {
    title: 'Resolve this report?',
    confirm: 'Resolve',
    tone: 'primary',
    body: (r) =>
      `Mark the report as handled. “${r.jobTitle}” ${r.jobHidden ? 'stays hidden' : 'stays visible to candidates'}.`,
  },
  dismiss: {
    title: 'Dismiss this report?',
    confirm: 'Dismiss',
    tone: 'primary',
    body: () => 'Use this when the report is unfounded. The job is not changed.',
  },
};

/** Confirm a review decision with an optional internal note. */
export function ReviewReportDialog({ report, mode, loading, onClose, onConfirm }: {
  report: JobReport | null;
  mode: ReviewMode;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  const open = !!report;

  useEffect(() => {
    if (open) setNote('');
  }, [open, mode]);

  if (!report) return null;
  const copy = COPY[mode];

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={copy.title}
      description={copy.body(report)}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={copy.tone} onClick={() => onConfirm(note.trim())} loading={loading}>{copy.confirm}</Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(note.trim()); }}>
        <FormField label="Note (optional)" hint={`Visible to admins only. ${note.length}/${MAX_NOTE}`}>
          {(id) => (
            <Textarea
              id={id}
              rows={3}
              maxLength={MAX_NOTE}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === 'dismiss' ? 'e.g. Salary range is accurate; checked with the employer' : 'e.g. Confirmed the posting asks for an upfront fee'}
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
