'use client';

import { clsx } from 'clsx';

interface SeoFeature {
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
}

interface SeoContentProps {
  className?: string;
  headline: string;
  subheadline: string;
  introText: string;
  features: SeoFeature[];
  closingHeadline: string;
  closingText: string;
}

export function MSSeoContent({
  className,
  headline,
  subheadline,
  introText,
  features,
  closingHeadline,
  closingText,
}: SeoContentProps) {
  return (
    <section className={clsx('mx-auto max-w-7xl px-6 py-16', className)}>
      {/* SEO Headline Block */}
      <header className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {headline}
        </h2>
        <p className="mt-2 text-lg font-medium text-gray-600">{subheadline}</p>
        <p className="mt-6 text-base leading-relaxed text-gray-700">{introText}</p>
      </header>

      {/* Feature Grid with Images */}
      <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <article className="group" key={index}>
            <div className="overflow-hidden rounded-xl">
              <img
                alt={feature.imageAlt}
                className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                src={feature.imageSrc}
              />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {feature.description}
            </p>
          </article>
        ))}
      </div>

      {/* Closing SEO Block */}
      <footer className="mx-auto mt-16 max-w-3xl text-center">
        <h3 className="text-2xl font-bold text-gray-900">{closingHeadline}</h3>
        <p className="mt-4 text-base leading-relaxed text-gray-600">
          {closingText}
        </p>
      </footer>
    </section>
  );
}
