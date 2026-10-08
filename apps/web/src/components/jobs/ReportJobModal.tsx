'use client';

import { useEffect, useId, useState } from 'react';
import { useReportJob } from '@/hooks/useSettings';
import { cn } from '@/lib/cn';
import { REPORT_REASON_LABELS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { ReportReason } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';

const MAX_DETAILS = 1000;
const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

/** Lets a signed-in user flag a job posting for moderator review. */
export function ReportJobModal({ jobId, jobTitle, open, onClose }: {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const ids = useId();
  const report = useReportJob();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason(null);
      setDetails('');
      setError(null);
      report.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = () => {
    if (!reason) {
      setError('Choose the reason that best describes the problem.');
      return;
    }
    setError(null);
    report.mutate(
      { jobId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Thanks — our team will review this job.');
          onClose();
        },
        onError: (err) => setError(getErrorMessage(err, "We couldn't send your report. Please try again.")),
      }
    );
  };

  const close = () => { if (!report.isPending) onClose(); };
  const detailsId = `${ids}-details`;
  const errorId = `${ids}-error`;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Report this job"
      description={`Tell us what's wrong with “${jobTitle}”. Only NexHire moderators see your report.`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={report.isPending}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={report.isPending}>Submit report</Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5" noValidate>
        <fieldset aria-describedby={error ? errorId : undefined}>
          <legend className="text-sm font-medium text-fg-secondary">
            Reason<span className="text-rose-500 ml-0.5" aria-hidden>*</span>
          </legend>
          <div className="mt-2 space-y-2">
            {REASONS.map((r) => (
              <label
                key={r}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors',
                  reason === r ? 'border-primary-500 bg-primary-50/60 text-fg' : 'border-line text-fg-secondary hover:bg-muted'
                )}
              >
                <input
                  type="radio"
                  name={`${ids}-reason`}
                  value={r}
                  checked={reason === r}
                  onChange={() => { setReason(r); setError(null); }}
                  className="h-4 w-4 border-line-strong text-primary-600 focus:ring-primary-500"
                />
                {REPORT_REASON_LABELS[r]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor={detailsId} className="block text-sm font-medium text-fg-secondary">
            Details <span className="font-normal text-fg-muted">(optional)</span>
          </label>
          <Textarea
            id={detailsId}
            rows={4}
            maxLength={MAX_DETAILS}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Anything that helps us review it, e.g. what the posting asked you to do."
            aria-describedby={`${detailsId}-count`}
          />
          <p id={`${detailsId}-count`} className="text-right text-xs text-fg-muted tabular-nums">
            {details.length}/{MAX_DETAILS}
          </p>
        </div>

        {error && (
          <p id={errorId} role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
