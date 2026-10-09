import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { matchTone } from './match';

export function MatchBadge({ score, className }: { score: number; className?: string }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <Badge tone={matchTone(value)} className={className}>
      <Sparkles className="w-3 h-3" aria-hidden />
      {value}% match
    </Badge>
  );
}
