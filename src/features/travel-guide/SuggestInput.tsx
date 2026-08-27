'use client';

import { useEffect, useId, useRef, useState } from 'react';

export interface Suggestion {
  /** Written into the field when the row is chosen. */
  value: string;
  label: string;
  hint?: string;
}

interface SuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called only for a non-empty query; return at most a handful of rows. */
  suggest: (query: string) => Suggestion[];
  placeholder?: string;
  className?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: 'text' | 'search';
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  id?: string;
}

/**
 * A text field that proposes matches once something is typed.
 *
 * `<datalist>` cannot do this: browsers reveal every option the moment the
 * field is focused, which buries the field under a hundred airports. Here the
 * list stays closed until there is a query, and the field remains free text —
 * a value that never matches a suggestion is still submitted as typed.
 */
export default function SuggestInput({
  value,
  onChange,
  suggest,
  placeholder,
  className,
  maxLength,
  autoComplete = 'off',
  inputMode = 'text',
  id,
  ...aria
}: SuggestInputProps) {
  const generatedId = useId();
  const listId = `${id ?? generatedId}-suggestions`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const query = value.trim();
  const suggestions = open && query ? suggest(query) : [];

  // Closing on outside pointerdown rather than on blur keeps a click on a row
  // from dismissing the list before the row's own handler runs.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const commit = (suggestion: Suggestion) => {
    onChange(suggestion.value);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + step;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }

    // Enter only intercepts an actively highlighted row, so pressing it with
    // nothing highlighted still submits the form.
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      commit(suggestions[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          // A highlight from the previous query must not carry over.
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        spellCheck={false}
        {...aria}
      />

      {suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-rule bg-panel py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.value} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                // pointerdown fires before the input's blur, so the value is
                // committed even though focus is about to move.
                onPointerDown={(event) => {
                  event.preventDefault();
                  commit(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-xs ${
                  index === activeIndex ? 'bg-panel-raised text-foreground' : 'text-muted'
                }`}
              >
                <span className="font-mono font-semibold">{suggestion.value}</span>
                <span className="min-w-0 flex-1 truncate">{suggestion.label}</span>
                {suggestion.hint && <span className="shrink-0 text-[10px] text-faint">{suggestion.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
