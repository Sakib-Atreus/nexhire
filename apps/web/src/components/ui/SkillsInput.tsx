'use client';

import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { X } from 'lucide-react';

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
}

export function SkillsInput({
  value,
  onChange,
  placeholder = 'Type a skill and press Enter…',
  maxSkills = 20,
}: SkillsInputProps) {
  const [input, setInput] = useState('');

  function addSkill(raw: string) {
    const skill = raw.trim().replace(/,$/, '').trim();
    if (!skill) return;
    if (value.includes(skill)) return;
    if (value.length >= maxSkills) return;
    onChange([...value, skill]);
  }

  function removeSkill(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
      setInput('');
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.endsWith(',')) {
      addSkill(val);
      setInput('');
    } else {
      setInput(val);
    }
  }

  const atLimit = value.length >= maxSkills;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition">
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 transition-colors"
              aria-label={`Remove ${skill}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {!atLimit && (
          <input
            type="text"
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[8rem] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
        )}
      </div>
      <p className="text-xs text-slate-400">
        {value.length}/{maxSkills} skills · Press Enter or comma to add
      </p>
    </div>
  );
}
