'use client';

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, GripVertical, UserMinus } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_BAR, PIPELINE_STAGES } from '@/lib/constants';
import { formatDate, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { ApplicantStatusMenu } from '@/components/recruiter/ApplicantStatusMenu';
import { ActivityCounts } from '@/components/recruiter/ApplicantCard';
import { StarDisplay } from './StarRating';
import { InterviewChip } from './InterviewChip';
import { stageLabel } from './stages';

type MoveHandler = (app: Application, status: ApplicationStatus) => void;

const COLUMN_PREFIX = 'col:';
const columnId = (s: ApplicationStatus) => `${COLUMN_PREFIX}${s}`;
const statusOf = (id: UniqueIdentifier) => String(id).slice(COLUMN_PREFIX.length) as ApplicationStatus;

// ─── Sensors ─────────────────────────────────────────────────────────────────

/** Mouse/pen only: touch is handled by TouchSensor with a press delay so the board can still scroll. */
class MousePointerSensor extends PointerSensor {
  static activators = [{
    eventName: 'onPointerDown' as const,
    handler: ({ nativeEvent: e }: ReactPointerEvent) => e.isPrimary && e.button === 0 && e.pointerType !== 'touch',
  }];
}

class DelayedTouchSensor extends TouchSensor {
  static activators = [{
    eventName: 'onTouchStart' as const,
    handler: ({ nativeEvent: e }: ReactTouchEvent) => e.touches.length <= 1,
  }];
}

/** Arrow Left/Right jump between columns while dragging with the keyboard. */
const columnCoordinates: KeyboardCoordinateGetter = (event, { context: { droppableContainers, droppableRects, collisionRect } }) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return undefined;
  event.preventDefault();
  if (!collisionRect || event.code === 'ArrowUp' || event.code === 'ArrowDown') return undefined;

  const columns = droppableContainers
    .getEnabled()
    .map((c) => ({ id: c.id, rect: droppableRects.get(c.id) }))
    .filter((c): c is { id: UniqueIdentifier; rect: NonNullable<typeof c.rect> } => !!c.rect)
    .sort((a, b) => a.rect.left - b.rect.left);
  if (columns.length === 0) return undefined;

  const cx = collisionRect.left + collisionRect.width / 2;
  let current = columns.findIndex((c) => cx >= c.rect.left && cx <= c.rect.left + c.rect.width);
  if (current < 0) {
    current = columns.reduce((best, c, i) =>
      Math.abs(c.rect.left + c.rect.width / 2 - cx) < Math.abs(columns[best].rect.left + columns[best].rect.width / 2 - cx) ? i : best, 0);
  }
  const target = columns[Math.max(0, Math.min(columns.length - 1, current + (event.code === 'ArrowRight' ? 1 : -1)))];
  return {
    x: target.rect.left + target.rect.width / 2 - collisionRect.width / 2,
    y: target.rect.top + Math.min(target.rect.height, 400) / 2 - collisionRect.height / 2,
  };
};

/** Pointer: the column under the cursor. Keyboard: the column whose center is closest. */
const collisionDetection: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    const hits = pointerWithin(args);
    return hits.length ? hits : rectIntersection(args);
  }
  return closestCenter(args);
};

// ─── Card ────────────────────────────────────────────────────────────────────

function CardBody({ app, onMove, onOpen, handle }: {
  app: Application;
  onMove?: MoveHandler;
  onOpen?: (app: Application) => void;
  handle?: React.ReactNode;
}) {
  const nameClass = 'block max-w-full font-semibold text-sm text-fg truncate text-left group-hover:text-primary-700';
  return (
    <>
      <div className="flex items-start gap-2.5">
        <Avatar name={app.candidateName} src={app.candidateAvatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          {onOpen ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpen(app); }}
              className={cn(nameClass, 'rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500')}
            >
              {app.candidateName}
            </button>
          ) : (
            <p className={nameClass}>{app.candidateName}</p>
          )}
          {app.candidateHeadline && <p className="text-xs text-fg-muted line-clamp-2 break-words">{app.candidateHeadline}</p>}
        </div>
        {handle}
      </div>
      {app.nextInterviewAt && <InterviewChip at={app.nextInterviewAt} response={app.nextInterviewResponse} className="mt-2" />}
      {(app.rating || app.noteCount || app.messageCount) ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <StarDisplay rating={app.rating} />
          <ActivityCounts app={app} className="ml-auto" />
        </div>
      ) : null}
      <div className="mt-2 pt-2 border-t border-line-subtle flex items-center justify-between gap-2">
        <span className="text-[11px] text-fg-subtle truncate">
          Applied <time dateTime={app.appliedAt} title={formatDate(app.appliedAt)}>{timeAgo(app.appliedAt)}</time>
        </span>
        {onMove && <ApplicantStatusMenu app={app} onMove={onMove} size="xs" />}
      </div>
    </>
  );
}

function BoardCard({ app, onOpen, onMove, suppressClick }: {
  app: Application;
  onOpen: (app: Application) => void;
  onMove: MoveHandler;
  suppressClick: () => boolean;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({ id: app.id, data: { app } });

  return (
    <li>
      <div
        ref={setNodeRef}
        {...listeners}
        onClick={() => { if (!suppressClick()) onOpen(app); }}
        className={cn(
          'group bg-surface rounded-lg border border-line p-3 shadow-sm cursor-pointer select-none touch-manipulation',
          'hover:border-primary-300 hover:shadow transition-[border-color,box-shadow]',
          isDragging && 'opacity-40 border-dashed'
        )}
      >
        <CardBody
          app={app}
          onMove={onMove}
          onOpen={onOpen}
          handle={
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              aria-label={`Drag ${app.candidateName} to another stage`}
              onClick={(e) => { e.stopPropagation(); onOpen(app); }}
              className="-mr-1 -mt-0.5 p-1 rounded text-fg-faint hover:text-fg-muted cursor-grab focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <GripVertical className="w-4 h-4" aria-hidden />
            </button>
          }
        />
      </div>
    </li>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function Column({ status, label, apps, onOpen, onMove, suppressClick, highlight }: {
  status: ApplicationStatus;
  label: string;
  apps: Application[];
  onOpen: (app: Application) => void;
  onMove: MoveHandler;
  suppressClick: () => boolean;
  highlight?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId(status) });
  const headingId = `col-heading-${status}`;
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col flex-1 basis-0 min-w-[15rem] rounded-xl bg-subtle/70 border border-transparent transition-colors',
        isOver && 'bg-primary-50 border-primary-300',
        highlight && !isOver && 'bg-emerald-50/60'
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn('w-2 h-2 rounded-full', APPLICATION_STATUS_BAR[status])} aria-hidden />
        <h2 id={headingId} className="text-sm font-semibold text-fg-soft">{label}</h2>
        <span className="ml-auto text-xs font-medium text-fg-muted bg-surface rounded-full px-2 py-0.5 tabular-nums ring-1 ring-line">
          {apps.length}
          <span className="sr-only"> applicant{apps.length === 1 ? '' : 's'}</span>
        </span>
      </header>
      <ul className="flex-1 px-2 pb-2 space-y-2 min-h-[8rem]">
        {apps.map((a) => (
          <BoardCard key={a.id} app={a} onOpen={onOpen} onMove={onMove} suppressClick={suppressClick} />
        ))}
        {apps.length === 0 && (
          <li className="h-24 rounded-lg border-2 border-dashed border-line flex items-center justify-center text-xs text-fg-subtle">
            Drop applicants here
          </li>
        )}
      </ul>
    </section>
  );
}

function RejectedColumn({ apps, expanded, onToggle, onOpen, onMove, suppressClick }: {
  apps: Application[];
  expanded: boolean;
  onToggle: () => void;
  onOpen: (app: Application) => void;
  onMove: MoveHandler;
  suppressClick: () => boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId('REJECTED') });
  if (expanded) {
    return (
      <section
        ref={setNodeRef}
        aria-label={`Rejected, ${apps.length} applicants`}
        className={cn(
          'flex flex-col flex-1 basis-0 min-w-[15rem] rounded-xl bg-rose-50/60 border border-transparent transition-colors',
          isOver && 'bg-rose-100 border-rose-300'
        )}
      >
        <header className="flex items-center gap-2 px-3 pt-3 pb-2">
          <span className={cn('w-2 h-2 rounded-full', APPLICATION_STATUS_BAR.REJECTED)} aria-hidden />
          <h2 className="text-sm font-semibold text-fg-soft">Rejected</h2>
          <span className="text-xs font-medium text-fg-muted bg-surface rounded-full px-2 py-0.5 tabular-nums ring-1 ring-line">{apps.length}</span>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded
            aria-label="Collapse rejected column"
            className="ml-auto p-1 rounded text-fg-subtle hover:text-fg-secondary hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </header>
        <ul className="flex-1 px-2 pb-2 space-y-2 min-h-[8rem]">
          {apps.map((a) => (
            <BoardCard key={a.id} app={a} onOpen={onOpen} onMove={onMove} suppressClick={suppressClick} />
          ))}
          {apps.length === 0 && (
            <li className="h-24 rounded-lg border-2 border-dashed border-rose-200 flex items-center justify-center text-xs text-rose-400">
              Drop to reject
            </li>
          )}
        </ul>
      </section>
    );
  }
  return (
    <section
      ref={setNodeRef}
      aria-label={`Rejected, ${apps.length} applicants (collapsed)`}
      className={cn(
        'flex-shrink-0 w-14 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 transition-colors',
        isOver && 'bg-rose-100 border-rose-400 border-solid'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={false}
        className="w-full h-full min-h-[12rem] flex flex-col items-center gap-3 py-3 rounded-xl text-rose-700 hover:bg-rose-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden />
        <span className="text-xs font-semibold tabular-nums bg-surface rounded-full px-1.5 py-0.5 ring-1 ring-rose-200">{apps.length}</span>
        <span className="text-xs font-semibold tracking-wide [writing-mode:vertical-rl] rotate-180">Rejected</span>
        <span className="sr-only">Show rejected applicants</span>
      </button>
    </section>
  );
}

/** Read-only list of withdrawn applications (candidate-only status). */
function WithdrawnSection({ apps, onOpen }: { apps: Application[]; onOpen: (app: Application) => void }) {
  const [open, setOpen] = useState(false);
  if (apps.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-fg-tertiary hover:bg-muted rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <UserMinus className="w-4 h-4 text-fg-subtle" aria-hidden />
        <span className="font-medium">Withdrawn</span>
        <span className="text-xs tabular-nums text-fg-muted bg-subtle rounded-full px-2 py-0.5">{apps.length}</span>
        <span className="text-xs text-fg-subtle hidden sm:inline">· Withdrawn by the candidate, read-only</span>
        <ChevronRight className={cn('w-4 h-4 ml-auto text-fg-subtle transition-transform', open && 'rotate-90')} aria-hidden />
      </button>
      {open && (
        <ul className="grid gap-2 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onOpen(a)}
                className="w-full flex items-center gap-2.5 rounded-lg border border-line bg-muted p-2.5 text-left hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Avatar name={a.candidateName} src={a.candidateAvatarUrl} size="xs" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg-secondary truncate">{a.candidateName}</span>
                  <span className="block text-[11px] text-fg-subtle">Applied {timeAgo(a.appliedAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Board ───────────────────────────────────────────────────────────────────

export function PipelineBoard({ apps, withdrawn, onOpen, onMove }: {
  /** Visible (filtered) non-withdrawn applications. */
  apps: Application[];
  /** Visible withdrawn applications (read-only). */
  withdrawn: Application[];
  onOpen: (app: Application) => void;
  onMove: MoveHandler;
}) {
  const [active, setActive] = useState<Application | null>(null);
  const [rejectedOpen, setRejectedOpen] = useState(false);
  const lastDragEnd = useRef(0);
  const suppressClick = () => Date.now() - lastDragEnd.current < 250;

  const sensors = useSensors(
    useSensor(MousePointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(DelayedTouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnCoordinates })
  );

  const byStatus = useMemo(() => {
    const m = new Map<ApplicationStatus, Application[]>();
    apps.forEach((a) => m.set(a.status, [...(m.get(a.status) ?? []), a]));
    return m;
  }, [apps]);

  const nameOf = (id: UniqueIdentifier) => apps.find((a) => a.id === id)?.candidateName ?? 'Applicant';
  const announcements: Announcements = {
    onDragStart: ({ active: a }) => {
      const app = apps.find((x) => x.id === a.id);
      return `Picked up ${nameOf(a.id)}${app ? `, currently in ${stageLabel(app.status)}` : ''}. Use left and right arrows to choose a stage.`;
    },
    onDragOver: ({ active: a, over }) =>
      over ? `${nameOf(a.id)} is over ${stageLabel(statusOf(over.id))}.` : `${nameOf(a.id)} is not over a stage.`,
    onDragEnd: ({ active: a, over }) =>
      over ? `${nameOf(a.id)} dropped on ${stageLabel(statusOf(over.id))}.` : `${nameOf(a.id)} was dropped outside the board. No change.`,
    onDragCancel: ({ active: a }) => `Moving ${nameOf(a.id)} was cancelled.`,
  };

  function onDragStart(e: DragStartEvent) {
    setActive((e.active.data.current?.app as Application | undefined) ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    lastDragEnd.current = Date.now();
    setActive(null);
    const app = e.active.data.current?.app as Application | undefined;
    if (!app || !e.over) return;
    const status = statusOf(e.over.id);
    if (status !== app.status) onMove(app, status);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => { lastDragEnd.current = Date.now(); setActive(null); }}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'To move an applicant, press space or enter on the drag handle, use the left and right arrow keys to choose a stage, then press space or enter to drop, or escape to cancel. You can also use the Move to menu on each card.',
          },
        }}
      >
        <div
          role="region"
          aria-label="Hiring pipeline board"
          tabIndex={0}
          className="relative -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
        >
          <div className="flex gap-3 items-stretch">
            {PIPELINE_STAGES.map((s) => (
              <Column
                key={s.status}
                status={s.status}
                label={s.label}
                apps={byStatus.get(s.status) ?? []}
                onOpen={onOpen}
                onMove={onMove}
                suppressClick={suppressClick}
                highlight={s.status === 'HIRED' && (byStatus.get('HIRED')?.length ?? 0) > 0}
              />
            ))}
            <RejectedColumn
              apps={byStatus.get('REJECTED') ?? []}
              expanded={rejectedOpen}
              onToggle={() => setRejectedOpen((o) => !o)}
              onOpen={onOpen}
              onMove={onMove}
              suppressClick={suppressClick}
            />
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? (
            <div className="w-[15rem] bg-surface rounded-lg border border-primary-300 p-3 shadow-xl rotate-1 cursor-grabbing">
              <CardBody app={active} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <WithdrawnSection apps={withdrawn} onOpen={onOpen} />
    </>
  );
}
