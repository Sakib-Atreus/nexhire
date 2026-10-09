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
      className="flex flex-col sm:flex-row gap-2 rounded-xl bg-surface p-2 shadow-xl shadow-primary-950/20 max-w-xl transition-shadow dark:bg-white/[0.07] dark:ring-1 dark:ring-white/15 dark:backdrop-blur-md dark:shadow-[0_0_48px_-12px_rgba(129,140,248,0.7)] dark:focus-within:ring-[#818cf8]/70 dark:focus-within:shadow-[0_0_64px_-8px_rgba(129,140,248,0.85)]"
    >
      <label htmlFor="hero-search" className="sr-only">
        Search jobs by title, skill or keyword
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle dark:text-slate-300" aria-hidden />
        <input
          id="hero-search"
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Job title, skill or keyword"
          className="h-11 w-full rounded-lg border-0 bg-transparent pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-0"
        />
      </div>
      <button
        type="submit"
        className="h-11 px-5 rounded-lg bg-primary-600 text-sm font-semibold text-white hover:bg-primary-700 transition-all dark:bg-gradient-to-r dark:from-[#6366f1] dark:to-[#8b5cf6] dark:hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.8)] dark:hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        Search jobs
      </button>
    </form>
  );
}
