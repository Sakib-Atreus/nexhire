/** Normalize a skill for comparison: lowercase, keep only letters/digits plus "+" and "#" (C++, C#). */
export function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9+#]/g, '');
}

/** Badge tone for a 0–100 match score. */
export function matchTone(score: number): string {
  if (score >= 70) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  if (score >= 40) return 'bg-sky-50 text-sky-700 ring-sky-600/20';
  return 'bg-subtle text-fg-secondary ring-slate-500/20';
}

/** Splits a job's tags into those the candidate has and those they don't. */
export function compareSkills(profileSkills: string[], jobTags: string[]) {
  const have = new Set(profileSkills.map(normalizeSkill).filter(Boolean));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const tag of jobTags) {
    (have.has(normalizeSkill(tag)) ? matched : missing).push(tag);
  }
  return { matched, missing };
}
