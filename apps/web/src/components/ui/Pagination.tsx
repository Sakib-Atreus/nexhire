import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

/** Zero-based page control matching Spring's Page response. Renders nothing for a single page. */
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-4 pt-6" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="w-4 h-4" aria-hidden /> Previous
      </Button>
      <span className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-900">{page + 1}</span> of{' '}
        <span className="font-medium text-slate-900">{totalPages}</span>
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Next <ChevronRight className="w-4 h-4" aria-hidden />
      </Button>
    </nav>
  );
}
