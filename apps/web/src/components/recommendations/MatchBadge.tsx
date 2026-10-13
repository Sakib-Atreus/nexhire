import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { matchTone } from './match';

/** Below this score a badge would discourage more than help; the "Matches your skills" line still shows. */
const MIN_BADGE_SCORE = 50;

/** "Strong match" (70+) or "Good match" (50–69); exact score in the tooltip and for screen readers. */
export function MatchBadge({ score, className }: { score: number; className?: string }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  if (value < MIN_BADGE_SCORE) return null;
  return (
    <Badge tone={matchTone(value)} className={className}>
      <Sparkles className="w-3 h-3" aria-hidden />
      <span title={`${value}% match`}>{value >= 70 ? 'Strong match' : 'Good match'}</span>
      <span className="sr-only"> ({value}%)</span>
    </Badge>
  );
}
