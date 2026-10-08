import { EyeOff, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const HIDDEN_TONE = 'bg-amber-50 text-amber-800 ring-amber-600/25';
export const FEATURED_TONE = 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';

export function HiddenBadge({ className }: { className?: string }) {
  return (
    <Badge tone={HIDDEN_TONE} className={className}>
      <EyeOff className="w-3 h-3" aria-hidden /> Hidden
    </Badge>
  );
}

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <Badge tone={FEATURED_TONE} className={className}>
      <Star className="w-3 h-3 fill-current" aria-hidden /> Featured
    </Badge>
  );
}
