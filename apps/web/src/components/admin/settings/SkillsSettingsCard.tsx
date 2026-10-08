'use client';

import { useState } from 'react';
import { useUpdateSettingList } from '@/hooks/useAdmin';
import { Card, CardHeader } from '@/components/ui/Card';
import { SkillsInput } from '@/components/ui/SkillsInput';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { SettingsCardFooter, SettingsError, UnsavedBadge, sameList } from './SettingsCardParts';

const MAX_SKILLS = 300;
const MAX_LENGTH = 50;

export function SkillsSettingsCard({ saved }: { saved: string[] }) {
  const [base, setBase] = useState(saved);
  const [draft, setDraft] = useState(saved);
  const [serverError, setServerError] = useState<string | null>(null);
  const update = useUpdateSettingList('skills');

  const dirty = !sameList(draft, base);
  if (!sameList(saved, base) && !dirty) {
    setBase(saved);
    setDraft(saved);
  }

  const tooLong = draft.filter((s) => s.length > MAX_LENGTH);
  const localError = tooLong.length > 0
    ? `Skill names must be ${MAX_LENGTH} characters or fewer. Shorten or remove: ${tooLong.map((s) => `“${s.slice(0, 24)}…”`).join(', ')}`
    : null;

  const save = () => {
    if (localError) return;
    update.mutate(draft, {
      onSuccess: (result) => {
        const next = result ?? draft;
        const merged = draft.length - next.length;
        setBase(next);
        setDraft(next);
        toast.success(
          'Skills saved',
          merged > 0 ? `${merged} duplicate${merged === 1 ? ' was' : 's were'} merged.` : `${next.length} suggested skills.`
        );
      },
      onError: (err) => {
        const msg = getErrorMessage(err, 'We could not save the skills.');
        setServerError(msg);
        toast.error('Skills not saved', msg);
      },
    });
  };

  return (
    <Card>
      <CardHeader
        title="Suggested skills"
        description="Offered as quick picks when recruiters tag a job. Recruiters can still type their own."
        action={<UnsavedBadge show={dirty} />}
      />
      <div className="p-5 space-y-3">
        <SettingsError message={serverError ?? localError} />
        <p id="skills-editor-label" className="sr-only">Suggested skills</p>
        <div aria-labelledby="skills-editor-label" role="group">
          <SkillsInput
            value={draft}
            onChange={(next) => {
              setDraft(next);
              setServerError(null);
            }}
            placeholder="Type a skill and press Enter…"
            maxSkills={MAX_SKILLS}
          />
        </div>
        <p className="text-xs text-fg-muted">
          The first skills in the list are shown first as suggestions. Duplicates (ignoring case) are merged when you save.
        </p>
      </div>
      <SettingsCardFooter
        dirty={dirty}
        saving={update.isPending}
        invalid={!!localError}
        onDiscard={() => {
          setDraft(base);
          setServerError(null);
        }}
        onSave={save}
      />
    </Card>
  );
}
