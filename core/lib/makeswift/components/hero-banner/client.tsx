'use client';

import { clsx } from 'clsx';

interface HeroBannerProps {
  className?: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  imageAlt: string;
  buttonText: string;
  buttonLink?: { href?: string; target?: string };
  textAlign: 'left' | 'center' | 'right';
  overlayOpacity: number;
  minHeight: 'small' | 'medium' | 'large' | 'full';
  textColor: 'light' | 'dark';
}

const heightMap = {
  small: 'min-h-[300px]',
  medium: 'min-h-[450px]',
  large: 'min-h-[600px]',
  full: 'min-h-screen',
};

export function MSHeroBanner({
  className,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  buttonText,
  buttonLink,
  textAlign = 'center',
  overlayOpacity = 40,
  minHeight = 'medium',
  textColor = 'light',
}: HeroBannerProps) {
  const isLight = textColor === 'light';

  return (
    <section
      className={clsx('relative flex items-center overflow-hidden', heightMap[minHeight], className)}
    >
      {imageSrc && (
        <img
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
          src={imageSrc}
        />
      )}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity / 100 }}
      />
      <div
        className={clsx('relative z-10 mx-auto w-full max-w-4xl px-6 py-12', {
          'text-left': textAlign === 'left',
          'text-center': textAlign === 'center',
          'text-right': textAlign === 'right',
        })}
      >
        <h1
          className={clsx('text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl', {
            'text-white': isLight,
            'text-gray-900': !isLight,
          })}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={clsx('mt-4 text-lg sm:text-xl', {
              'text-white/90': isLight,
              'text-gray-700': !isLight,
            })}
          >
            {subtitle}
          </p>
        )}
        {buttonText && buttonLink?.href && (
          <a
            className={clsx(
              'mt-8 inline-block rounded-md px-8 py-3 text-base font-semibold transition-colors',
              {
                'bg-white text-gray-900 hover:bg-white/90': isLight,
                'bg-gray-900 text-white hover:bg-gray-800': !isLight,
              },
            )}
            href={buttonLink.href}
            target={buttonLink.target}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}
