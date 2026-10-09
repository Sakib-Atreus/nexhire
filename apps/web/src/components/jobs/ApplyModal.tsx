'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronDown, ExternalLink, FileText, Lightbulb, Zap } from 'lucide-react';
import type { Job } from '@/types';
import { useApply } from '@/hooks/useApplications';
import { useMe, useUpdateProfile } from '@/hooks/useProfile';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Textarea } from '@/components/ui/Field';
import { FileUpload } from '@/components/ui/FileUpload';
import { getErrorMessage, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const COVER_LETTER_MAX = 5000;
const ANSWER_MAX = 1500;

type ResumeMode = 'saved' | 'upload' | 'url';

const MODE_LABELS: Record<ResumeMode, string> = {
  saved: 'Saved resume',
  upload: 'Upload a different file',
  url: 'Paste a link',
};

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

/** Best-effort file name for a pasted resume link ("resume.pdf"), falling back to the host. */
function fileNameFromUrl(value: string): string {
  try {
    const u = new URL(value);
    const last = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() ?? '');
    return (last || u.hostname).slice(0, 255);
  } catch {
    return 'Resume link';
  }
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
  const [uploadedName, setUploadedName] = useState('');
  // null = not chosen yet: defaults to the saved resume when the profile has one.
  const [chosenMode, setChosenMode] = useState<ResumeMode | null>(null);
  const [saveChoice, setSaveChoice] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
  const [errors, setErrors] = useState<Errors>({});
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const { mutate: apply, isPending, error, reset } = useApply();
  const { data: me, isLoading: meLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const tabsId = useId();
  const saveId = useId();

  const savedUrl = me?.resumeUrl?.trim() || '';
  const savedName = me?.resumeFileName?.trim() || 'My resume';
  const hasSaved = !!savedUrl;
  const mode: ResumeMode = chosenMode ?? (hasSaved ? 'saved' : 'upload');
  const modes: ResumeMode[] = hasSaved ? ['saved', 'upload', 'url'] : ['upload', 'url'];
  // "Save to profile" defaults on only when there is nothing saved yet.
  const saveToProfile = saveChoice ?? !hasSaved;
  const quickApply = hasSaved && questions.length === 0;
  const coverLetterOpen = !quickApply || showCoverLetter || coverLetter.length > 0;

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

  const handleSubmit = (opts?: { quick?: boolean }) => {
    const useSaved = !!opts?.quick || mode === 'saved';
    const next: Errors = {};
    const url = useSaved ? savedUrl : resumeUrl.trim();
    if (useSaved && !url) {
      next.resume = 'Your saved resume is unavailable. Upload a file or paste a link instead.';
    } else if (!url) {
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

    const shouldSave = !useSaved && saveToProfile;
    const fileName = mode === 'upload' ? uploadedName || 'Resume' : fileNameFromUrl(url);
    apply(
      { jobId: job.id, resumeUrl: url, coverLetter: composeCoverLetter(coverLetter, questions, answers) },
      {
        onSuccess: () => {
          toast.success('Application submitted', `${job.companyName} will be notified. You can track progress in My applications.`);
          if (shouldSave) {
            updateProfile.mutate(
              { resumeUrl: url, resumeFileName: fileName },
              {
                onSuccess: () => toast.success('Resume saved to your profile', 'Next time you can apply in one click.'),
                onError: (err) => toast.error('Could not save your resume', getErrorMessage(err)),
              }
            );
          }
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
    setChosenMode(m);
    setResumeUrl('');
    setUploadedName('');
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
          <Button variant={quickApply && mode === 'saved' ? 'secondary' : 'primary'} onClick={() => handleSubmit()} loading={isPending}>
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
        {/* Quick apply */}
        {quickApply && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                  <Zap className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">Quick apply</p>
                  <p className="text-xs text-fg-tertiary break-words">
                    Send <span className="font-medium text-fg-secondary">{savedName}</span> to {job.companyName} in one click.
                  </p>
                </div>
              </div>
              <Button onClick={() => handleSubmit({ quick: true })} loading={isPending} className="sm:flex-shrink-0">
                {!isPending && <Zap className="h-3.5 w-3.5" aria-hidden />}
                Apply with saved resume
              </Button>
            </div>
          </div>
        )}

        {/* Resume */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-fg-secondary">
            Resume<span className="text-rose-500 ml-0.5" aria-hidden>*</span>
          </legend>
          <div role="tablist" aria-label="How to provide your resume" className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1 w-fit max-w-full">
            {modes.map((m) => (
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
                {m === 'upload' && !hasSaved ? 'Upload file' : MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${mode}`}>
            {mode === 'saved' ? (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <FileText className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">Use my saved resume · {savedName}</p>
                  {me?.resumeUpdatedAt && (
                    <p className="text-xs text-fg-muted">Updated {timeAgo(me.resumeUpdatedAt)}</p>
                  )}
                </div>
                <a
                  href={savedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                >
                  View <ExternalLink className="h-3 w-3" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            ) : mode === 'upload' ? (
              <FileUpload
                onFileSelected={(file) => setUploadedName(file.name)}
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
          {mode !== 'saved' && !meLoading && (
            <label htmlFor={saveId} className="flex cursor-pointer items-start gap-2 pt-1 text-sm text-fg-secondary select-none">
              <input
                id={saveId}
                type="checkbox"
                checked={saveToProfile}
                onChange={(e) => setSaveChoice(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line-strong text-primary-600 focus:ring-primary-500"
              />
              <span>
                Save this resume to my profile for next time
                {hasSaved && <span className="block text-xs text-fg-muted">Replaces {savedName}.</span>}
              </span>
            </label>
          )}
          {!hasSaved && !meLoading && (
            <p className="flex items-center gap-1.5 text-xs text-fg-muted">
              <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" aria-hidden />
              <span>
                <Link href="/profile" className="font-medium text-primary-600 hover:underline">Save a resume in your profile</Link>{' '}
                to apply in one click.
              </span>
            </p>
          )}
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
        {!coverLetterOpen ? (
          <Button variant="ghost" size="sm" onClick={() => setShowCoverLetter(true)} aria-expanded={false} className="-ml-2">
            <ChevronDown className="h-3.5 w-3.5" aria-hidden /> Add a cover letter (optional)
          </Button>
        ) : (
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
        )}

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
