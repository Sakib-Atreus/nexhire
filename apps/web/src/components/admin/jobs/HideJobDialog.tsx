'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';

const MAX_REASON = 500;

/** Asks for an optional moderation reason (recorded in the audit log) before hiding a job. */
export function HideJobDialog({ open, jobTitle, featured, loading, onClose, onConfirm }: {
  open: boolean;
  jobTitle: string;
  featured?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Hide this job?"
      description={`“${jobTitle}” will disappear from search and its page will be unavailable to candidates. The recruiter and admins can still see it.${featured ? ' It will also be removed from featured.' : ''}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(reason.trim())} loading={loading}>Hide job</Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(reason.trim()); }}>
        <FormField label="Reason (optional)" hint={`Saved to the audit log. ${reason.length}/${MAX_REASON}`}>
          {(id) => (
            <Textarea
              id={id}
              rows={3}
              maxLength={MAX_REASON}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Asks applicants to pay a training fee"
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
