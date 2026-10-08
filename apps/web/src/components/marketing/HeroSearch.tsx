'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

/** Hero keyword search that routes to /jobs?keyword=… */
export function HeroSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    router.push(q ? `/jobs?keyword=${encodeURIComponent(q)}` : '/jobs');
  };

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex flex-col sm:flex-row gap-2 rounded-xl bg-surface p-2 shadow-xl shadow-primary-950/20 max-w-xl"
    >
      <label htmlFor="hero-search" className="sr-only">
        Search jobs by title, skill or keyword
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" aria-hidden />
        <input
          id="hero-search"
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Job title, skill or keyword"
          className="h-11 w-full rounded-lg border-0 bg-transparent pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        />
      </div>
      <button
        type="submit"
        className="h-11 px-5 rounded-lg bg-primary-600 text-sm font-semibold text-white hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        Search jobs
      </button>
    </form>
  );
}
