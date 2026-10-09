'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { ExternalLink, FileText, Trash2, UploadCloud } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { getErrorMessage, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { User } from '@/types';

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Saved resume used for one-click Quick apply: view, replace or remove. */
export function ResumeCard({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const upload = useFileUpload();
  const update = useUpdateProfile();
  const uploading = upload.isPending || (update.isPending && !!uploadingName);

  const hasResume = !!user.resumeUrl;
  const fileName = user.resumeFileName || 'Resume';

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_RESUME_BYTES) {
      toast.error('File is too large', 'Choose a resume under 10 MB.');
      return;
    }
    setUploadingName(file.name);
    upload.mutate(file, {
      onSuccess: ({ url, fileName: uploadedName }) =>
        update.mutate(
          { resumeUrl: url, resumeFileName: uploadedName || file.name },
          {
            onSuccess: () => { setUploadingName(null); toast.success('Resume saved', 'It will be used for Quick apply.'); },
            onError: (err) => { setUploadingName(null); toast.error("Couldn't save your resume", getErrorMessage(err)); },
          }
        ),
      onError: (err) => { setUploadingName(null); toast.error('Upload failed', getErrorMessage(err)); },
    });
  }

  function remove() {
    update.mutate(
      { resumeUrl: '' },
      {
        onSuccess: () => { setConfirmRemove(false); toast.success('Resume removed'); },
        onError: (err) => toast.error("Couldn't remove your resume", getErrorMessage(err)),
      }
    );
  }

  const pick = () => inputRef.current?.click();

  return (
    <Card>
      <CardHeader title="Resume" description="Used for one-click Quick apply." />
      <div className="p-5">
        {hasResume ? (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600" aria-hidden>
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg" title={fileName}>{fileName}</p>
              {user.resumeUpdatedAt && <p className="text-xs text-fg-muted">Updated {timeAgo(user.resumeUpdatedAt)}</p>}
              <a
                href={user.resumeUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
              >
                View <ExternalLink className="h-3 w-3" aria-hidden />
                <span className="sr-only">{fileName} (opens in a new tab)</span>
              </a>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-line px-4 py-6 text-center transition-colors hover:border-primary-300 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UploadCloud className="h-7 w-7 text-fg-subtle" aria-hidden />
            <span className="text-sm font-medium text-fg-secondary">
              {uploading ? `Uploading ${uploadingName ?? ''}…` : 'Upload your resume'}
            </span>
            <span className="text-xs text-fg-subtle">PDF or Word, up to 10 MB</span>
          </button>
        )}

        {hasResume && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={pick} loading={uploading}>
              {!uploading && <UploadCloud className="h-3.5 w-3.5" aria-hidden />}
              {uploading ? 'Uploading…' : 'Upload new'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setConfirmRemove(true)}
              disabled={uploading}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
            </Button>
          </div>
        )}

        <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={onChange} />
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={remove}
        title="Remove your resume?"
        description="Quick apply will be unavailable until you upload a new one."
        confirmLabel="Remove resume"
        loading={update.isPending && !uploadingName}
      />
    </Card>
  );
}
