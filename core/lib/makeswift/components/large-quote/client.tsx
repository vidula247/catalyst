'use client';

import { clsx } from 'clsx';

interface LargeQuoteProps {
  className?: string;
  quote: string;
  author: string;
  role: string;
  accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  size: 'medium' | 'large' | 'x-large';
}

const accentMap = {
  blue: 'border-blue-500 text-blue-600',
  purple: 'border-purple-500 text-purple-600',
  green: 'border-emerald-500 text-emerald-600',
  orange: 'border-orange-500 text-orange-600',
  red: 'border-red-500 text-red-600',
};

const sizeMap = {
  medium: 'text-xl sm:text-2xl',
  large: 'text-2xl sm:text-3xl',
  'x-large': 'text-3xl sm:text-4xl lg:text-5xl',
};

export function MSLargeQuote({
  className,
  quote,
  author,
  role,
  accentColor = 'blue',
  size = 'large',
}: LargeQuoteProps) {
  return (
    <blockquote
      className={clsx(
        'border-l-4 py-10 pl-8 pr-4',
        accentMap[accentColor],
        className,
      )}
    >
      <p
        className={clsx(
          'font-light leading-relaxed text-gray-900',
          sizeMap[size],
        )}
      >
        &ldquo;{quote}&rdquo;
      </p>
      {(author || role) && (
        <footer className="mt-6">
          {author && (
            <span className="text-lg font-semibold text-gray-900">{author}</span>
          )}
          {author && role && <span className="text-gray-400"> &mdash; </span>}
          {role && <span className="text-base text-gray-500">{role}</span>}
        </footer>
      )}
    </blockquote>
  );
}
