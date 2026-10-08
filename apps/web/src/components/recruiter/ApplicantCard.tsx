'use client';

import { useId, useState } from 'react';
import { ChevronDown, ExternalLink, FileText, Mail, StickyNote } from 'lucide-react';
import type { Application } from '@/types';
import { useUpdateApplicationStatus } from '@/hooks/useApplications';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES } from '@/lib/constants';
import { formatDate, getErrorMessage, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { ApplicantStatusMenu } from './ApplicantStatusMenu';

const LONG_COVER_LETTER = 280;

function CoverLetter({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const isLong = text.length > LONG_COVER_LETTER || text.split('\n').length > 3;
  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
        <FileText className="w-3.5 h-3.5" aria-hidden /> Cover letter
      </p>
      <p id={id} className={cn('text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words', !expanded && isLong && 'line-clamp-3')}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={id}
          className="mt-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function Notes({ app }: { app: Application }) {
  const update = useUpdateApplicationStatus();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(app.notes ?? '');
  const panelId = useId();

  function save() {
    update.mutate(
      { id: app.id, status: app.status, notes },
      {
        onSuccess: () => {
          toast.success('Notes saved');
          setOpen(false);
        },
        onError: (err) => toast.error('Could not save notes', getErrorMessage(err)),
      }
    );
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-xs font-medium text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
      >
        <StickyNote className="w-3.5 h-3.5" aria-hidden />
        {app.notes ? 'Internal notes' : 'Add internal notes'}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {!open && app.notes && <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 whitespace-pre-line">{app.notes}</p>}
      {open && (
        <div id={panelId} className="mt-2 space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            aria-label={`Internal notes about ${app.candidateName}`}
            placeholder="Only your team can see these notes."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} loading={update.isPending}>Save notes</Button>
            <Button size="sm" variant="ghost" onClick={() => { setNotes(app.notes ?? ''); setOpen(false); }} disabled={update.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApplicantCard({ app, selected, onToggle }: {
  app: Application;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const selectable = app.status !== 'WITHDRAWN' && app.status !== 'REJECTED';
  return (
    <Card className={cn('p-4 sm:p-5 transition-shadow', selected && 'border-primary-400 ring-2 ring-primary-100')}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(app.id)}
            disabled={!selectable}
            aria-label={`Select ${app.candidateName}`}
            title={selectable ? undefined : 'No further status changes are possible'}
            className="mt-3 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 flex-shrink-0"
          />
          <Avatar name={app.candidateName} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 break-words">{app.candidateName}</p>
            <a
              href={`mailto:${app.candidateEmail}`}
              className="text-sm text-slate-500 hover:text-primary-600 inline-flex items-center gap-1 max-w-full"
            >
              <Mail className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
              <span className="truncate">{app.candidateEmail}</span>
            </a>
            <p className="text-xs text-slate-400 mt-0.5">
              Applied <time dateTime={app.appliedAt} title={formatDate(app.appliedAt)}>{timeAgo(app.appliedAt)}</time>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 pl-7 sm:pl-0">
          <Badge tone={APPLICATION_STATUS_STYLES[app.status]}>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
          <ApplicantStatusMenu app={app} />
        </div>
      </div>

      {app.coverLetter?.trim() && <CoverLetter text={app.coverLetter.trim()} />}

      {app.resumeUrl && (
        <a
          href={app.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('secondary', 'sm', 'mt-3')}
        >
          <FileText className="w-3.5 h-3.5" aria-hidden />
          View resume
          <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}

      <Notes app={app} />
    </Card>
  );
}
