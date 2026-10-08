'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Job } from '@/types';
import { useApply } from '@/hooks/useApplications';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Textarea } from '@/components/ui/Field';
import { FileUpload } from '@/components/ui/FileUpload';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const COVER_LETTER_MAX = 5000;
const ANSWER_MAX = 1500;

type ResumeMode = 'upload' | 'url';

interface Errors {
  resume?: string;
  answers?: Record<number, string>;
}

/** Builds the text sent as `coverLetter`. The API has no separate field for screening answers. */
function composeCoverLetter(coverLetter: string, questions: string[], answers: string[]): string | undefined {
  const parts: string[] = [];
  if (coverLetter.trim()) parts.push(coverLetter.trim());
  if (questions.length > 0) {
    const qa = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]?.trim() ?? ''}`).join('\n\n');
    parts.push(`Screening questions:\n${qa}`);
  }
  return parts.length ? parts.join('\n\n---\n\n') : undefined;
}

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ApplyModal({ job, open, onClose }: { job: Job; open: boolean; onClose: () => void }) {
  const questions = (job.screeningQuestions ?? []).map((q) => q.trim()).filter(Boolean);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [mode, setMode] = useState<ResumeMode>('upload');
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
  const [errors, setErrors] = useState<Errors>({});
  const { mutate: apply, isPending, error, reset } = useApply();
  const tabsId = useId();

  // Modal re-runs its focus effect when onClose changes, so keep this callback stable.
  const pendingRef = useRef(isPending);
  pendingRef.current = isPending;
  const handleClose = useCallback(() => {
    if (!pendingRef.current) onClose();
  }, [onClose]);

  // Clear a stale server error when the dialog is reopened.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const handleSubmit = () => {
    const next: Errors = {};
    const url = resumeUrl.trim();
    if (!url) {
      next.resume = mode === 'upload' ? 'Upload your resume to continue.' : 'Paste a link to your resume to continue.';
    } else if (mode === 'url' && !isValidUrl(url)) {
      next.resume = 'Enter a full link starting with https://';
    }
    const answerErrors: Record<number, string> = {};
    questions.forEach((_, i) => {
      if (!answers[i]?.trim()) answerErrors[i] = 'Please answer this question.';
    });
    if (Object.keys(answerErrors).length) next.answers = answerErrors;

    setErrors(next);
    if (next.resume || next.answers) return;

    apply(
      { jobId: job.id, resumeUrl: url, coverLetter: composeCoverLetter(coverLetter, questions, answers) },
      {
        onSuccess: () => {
          toast.success('Application submitted', `${job.companyName} will be notified. You can track progress in My applications.`);
          onClose();
        },
      }
    );
  };

  const setAnswer = (i: number, value: string) => {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? value : a)));
    if (errors.answers?.[i]) {
      setErrors((prev) => {
        const rest = { ...prev.answers };
        delete rest[i];
        return { ...prev, answers: rest };
      });
    }
  };

  const switchMode = (m: ResumeMode) => {
    setMode(m);
    setResumeUrl('');
    setErrors((p) => ({ ...p, resume: undefined }));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Apply for ${job.title}`}
      description={job.companyName}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {isPending ? 'Submitting…' : 'Submit application'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        {/* Resume */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-fg-secondary">
            Resume<span className="text-rose-500 ml-0.5" aria-hidden>*</span>
          </legend>
          <div role="tablist" aria-label="How to provide your resume" className="inline-flex rounded-lg bg-subtle p-1">
            {(['upload', 'url'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                id={`${tabsId}-${m}`}
                aria-selected={mode === m}
                aria-controls={`${tabsId}-panel`}
                onClick={() => switchMode(m)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  mode === m ? 'bg-surface text-fg shadow-sm' : 'text-fg-tertiary hover:text-fg'
                )}
              >
                {m === 'upload' ? 'Upload file' : 'Paste a link'}
              </button>
            ))}
          </div>
          <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${mode}`}>
            {mode === 'upload' ? (
              <FileUpload
                onUpload={(url) => {
                  setResumeUrl(url);
                  setErrors((p) => ({ ...p, resume: undefined }));
                }}
                accept=".pdf,.doc,.docx"
                label="Upload your resume"
                hint="PDF, DOC or DOCX"
              />
            ) : (
              <Input
                type="url"
                inputMode="url"
                aria-label="Resume link"
                value={resumeUrl}
                invalid={!!errors.resume}
                onChange={(e) => {
                  setResumeUrl(e.target.value);
                  setErrors((p) => ({ ...p, resume: undefined }));
                }}
                placeholder="https://drive.google.com/… or https://yoursite.com/resume.pdf"
              />
            )}
          </div>
          {errors.resume && <p className="text-xs text-rose-600" role="alert">{errors.resume}</p>}
        </fieldset>

        {/* Screening questions */}
        {questions.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-fg">Screening questions</h3>
              <p className="text-xs text-fg-muted mt-0.5">The recruiter asks every applicant to answer these.</p>
            </div>
            {questions.map((q, i) => (
              <FormField key={i} label={q} required error={errors.answers?.[i]}>
                {(id) => (
                  <Textarea
                    id={id}
                    rows={3}
                    maxLength={ANSWER_MAX}
                    value={answers[i] ?? ''}
                    invalid={!!errors.answers?.[i]}
                    onChange={(e) => setAnswer(i, e.target.value)}
                    className="resize-y"
                  />
                )}
              </FormField>
            ))}
          </div>
        )}

        {/* Cover letter */}
        <FormField
          label="Cover letter (optional)"
          hint={`${coverLetter.length.toLocaleString('en-US')} / ${COVER_LETTER_MAX.toLocaleString('en-US')} characters`}
        >
          {(id) => (
            <Textarea
              id={id}
              rows={6}
              maxLength={COVER_LETTER_MAX}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder={`A few sentences on why you're interested in this role at ${job.companyName} and what relevant experience you bring.`}
              className="resize-y"
            />
          )}
        </FormField>

        {error && (
          <div role="alert" className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
            <p>{getErrorMessage(error, 'We could not submit your application. Please try again.')}</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
