'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, LogOut, RotateCcw, ShieldCheck, Video } from 'lucide-react';
import { LiveKitRoom, PreJoin, VideoConference, type LocalUserChoices } from '@livekit/components-react';
import { DisconnectReason } from 'livekit-client';
import '@livekit/components-styles';
import { useVideoJoin } from '@/hooks/useHiring';
import { getErrorMessage } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { formatTimeRange, formatWeekdayDate } from '@/components/interviews/interviewUtils';

type CallState = 'prejoin' | 'in-call' | 'left' | 'error';

/** Plain-language reasons for a call ending, so people know what to do next. */
function disconnectMessage(reason?: DisconnectReason): string | null {
  switch (reason) {
    case DisconnectReason.CLIENT_INITIATED:
      return null; // they pressed Leave
    case DisconnectReason.DUPLICATE_IDENTITY:
      return 'You joined this interview from another tab or device, so this window was disconnected.';
    case DisconnectReason.PARTICIPANT_REMOVED:
      return 'The host removed you from the call.';
    case DisconnectReason.ROOM_DELETED:
      return 'This video room was closed (the interview may have been cancelled).';
    case DisconnectReason.JOIN_FAILURE:
      return 'Couldn’t connect to the video room. Check your internet connection and try again.';
    default:
      return 'The connection was lost. Check your internet connection and rejoin.';
  }
}

/** Errors from the video service, translated. */
function connectErrorMessage(error: Error): string {
  const text = `${error.name} ${error.message}`.toLowerCase();
  if (text.includes('quota') || text.includes('limit')) {
    return 'The video service has reached its limit for now. Please use a meeting link for this interview.';
  }
  if (text.includes('permission') || text.includes('notallowed')) {
    return 'Your browser blocked the camera or microphone. Allow access in the address bar, then rejoin.';
  }
  if (text.includes('token') || text.includes('401') || text.includes('unauthorized')) {
    return 'Your access to this room has expired. Go back and open the interview again.';
  }
  return 'Couldn’t connect to the video room. Check your internet connection (or turn off a VPN or ad blocker) and try again.';
}

/** The interview's private NexHire video room (LiveKit), joined with a personal token. */
export default function InterviewCallPage() {
  const { id } = useParams<{ id: string }>();
  const join = useVideoJoin(id);
  const [state, setState] = useState<CallState>('prejoin');
  const [choices, setChoices] = useState<LocalUserChoices | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const details = join.data;
  const backHref = details?.owner ? '/interviews' : '/applications';

  if (join.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner className="h-8 w-8" />
        <span className="sr-only">Preparing your video room…</span>
      </div>
    );
  }

  if (join.isError || !details) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Clock className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-fg">You can’t join this call right now</h1>
        <p className="mt-1.5 text-sm text-fg-muted">{getErrorMessage(join.error, 'This video room isn’t available.')}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => join.refetch()} loading={join.isRefetching}>Try again</Button>
          <Link href="/calendar" className={buttonClasses('primary')}>Open calendar</Link>
        </div>
      </Card>
    );
  }

  const subtitle = details.owner ? `${details.candidateName} · ${details.jobTitle}` : `${details.jobTitle} · ${details.companyName}`;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={backHref} aria-label="Back" className={buttonClasses('ghost', 'sm', 'h-9 w-9 px-0')}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Video className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-fg">Interview: {subtitle}</h1>
            <p className="truncate text-sm text-fg-muted">
              {formatWeekdayDate(details.scheduledAt)} · {formatTimeRange(details)}
            </p>
          </div>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
          Private room · only invited people can join
          {details.owner && <span className="ml-1 rounded bg-primary-50 px-1.5 py-0.5 font-medium text-primary-700">Host</span>}
        </p>
      </div>

      {/* LiveKit's UI is dark in both themes, like most video apps. */}
      <Card data-lk-theme="default" className="relative overflow-hidden bg-slate-950">
        <div className="h-[calc(100dvh-15rem)] min-h-[460px] w-full lg:h-[calc(100dvh-13rem)]">
          {state === 'prejoin' && (
            <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-4 [&_.lk-username-container_input]:hidden [&_.lk-join-button]:mt-1 [&_.lk-join-button]:w-full [&_.lk-join-button]:justify-center [&_.lk-join-button]:bg-[#4f46e5] [&_.lk-join-button]:py-3 [&_.lk-join-button]:font-semibold [&_.lk-join-button]:text-white hover:[&_.lk-join-button]:bg-[#4338ca]">
              <div className="text-center">
                <h2 className="text-base font-semibold text-white">Check your camera and microphone</h2>
                <p className="mt-1 text-sm text-slate-400">You’ll join as <span className="font-medium text-slate-200">{details.userName}</span></p>
              </div>
              <PreJoin
                className="w-full max-w-lg"
                defaults={{ username: details.userName, videoEnabled: true, audioEnabled: true }}
                joinLabel="Join interview"
                micLabel="Microphone"
                camLabel="Camera"
                persistUserChoices
                onSubmit={(values) => {
                  setChoices(values);
                  setCallError(null);
                  setState('in-call');
                }}
                onError={(e) => setCallError(connectErrorMessage(e))}
              />
              {callError && <p className="max-w-md text-center text-sm text-amber-300">{callError}</p>}
            </div>
          )}

          {state === 'in-call' && choices && (
            <LiveKitRoom
              serverUrl={details.roomUrl}
              token={details.token}
              connect
              video={choices.videoEnabled ? { deviceId: choices.videoDeviceId || undefined } : false}
              audio={choices.audioEnabled ? { deviceId: choices.audioDeviceId || undefined } : false}
              onDisconnected={(reason) => {
                const message = disconnectMessage(reason);
                setCallError(message);
                setState(message ? 'error' : 'left');
              }}
              onError={(e) => {
                setCallError(connectErrorMessage(e));
                setState('error');
              }}
              onMediaDeviceFailure={() =>
                setCallError('Your camera or microphone isn’t available. Check that no other app is using it, or allow access in the browser.')
              }
              className="h-full"
            >
              <VideoConference />
            </LiveKitRoom>
          )}

          {(state === 'left' || state === 'error') && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                <LogOut className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">{state === 'left' ? 'You left the call' : 'Call disconnected'}</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                {state === 'error' ? callError : 'You can rejoin while the room is open (until an hour after the scheduled end).'}
              </p>
              <div className="mt-6 flex gap-2">
                <Button onClick={() => setState('prejoin')}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Rejoin
                </Button>
                <Link href={backHref} className={buttonClasses('secondary')}>Back to NexHire</Link>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
