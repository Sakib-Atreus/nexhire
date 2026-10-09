'use client';

import { useEffect, useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_STYLES } from '@/lib/constants';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Field';
import { stageLabel } from '@/components/pipeline/stages';
import { useMoveApplication } from '@/components/pipeline/useMoveApplication';

const MESSAGE_MAX = 2000;

function copyFor(status: ApplicationStatus, name: string) {
  if (status === 'HIRED') {
    return {
      title: `Mark ${name} as hired?`,
      description: 'The candidate will be notified. The job closes automatically once all openings are filled.',
      confirm: 'Mark as hired',
      tone: 'primary' as const,
    };
  }
  if (status === 'REJECTED') {
    return {
      title: `Reject ${name}?`,
      description: 'The candidate will be notified that they were not selected. You can move them back later if needed.',
      confirm: 'Reject applicant',
      tone: 'danger' as const,
    };
  }
  return {
    title: `Move ${name} to ${stageLabel(status)}?`,
    description: 'The candidate is notified and sees this update on their application timeline.',
    confirm: 'Move applicant',
    tone: 'primary' as const,
  };
}

/**
 * Confirms a stage change from the applicant drawer, with an optional message to the candidate
 * (sent as `notes` and shown on their timeline).
 */
export function StageChangeModal({ app, status, onClose }: {
  app: Application;
  /** Target stage; null keeps the dialog closed. */
  status: ApplicationStatus | null;
  onClose: () => void;
}) {
  const move = useMoveApplication(app.jobId);
  const [message, setMessage] = useState('');
  const inputId = useId();
  const hintId = useId();
  const firstName = app.candidateName.trim().split(/\s+/)[0] || 'the candidate';

  useEffect(() => {
    if (status) setMessage('');
  }, [status]);

  if (!status) return null;
  const copy = copyFor(status, app.candidateName);

  const confirm = () => {
    move.mutate({ app, status, notes: message }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={() => { if (!move.isPending) onClose(); }}
      title={copy.title}
      description={copy.description}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={move.isPending}>Cancel</Button>
          <Button variant={copy.tone} onClick={confirm} loading={move.isPending}>{copy.confirm}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={APPLICATION_STATUS_STYLES[app.status]}>{stageLabel(app.status)}</Badge>
          <ArrowRight className="w-4 h-4 text-fg-subtle" aria-label="to" />
          <Badge tone={APPLICATION_STATUS_STYLES[status]}>{stageLabel(status)}</Badge>
        </div>
        <div>
          <label htmlFor={inputId} className="block text-sm font-medium text-fg-secondary">
            Message to {firstName} <span className="font-normal text-fg-muted">(optional)</span>
          </label>
          <Textarea
            id={inputId}
            rows={4}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                confirm();
              }
            }}
            aria-describedby={hintId}
            placeholder={status === 'REJECTED'
              ? `Thank ${firstName} for their time and share any feedback…`
              : `Let ${firstName} know what happens next…`}
            className="mt-1.5 resize-y"
          />
          <p id={hintId} className="mt-1 text-xs text-fg-muted">
            Shown to {firstName} on their application timeline with this update.
          </p>
        </div>
      </div>
    </Modal>
  );
}
