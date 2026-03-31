import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { getPageSnapshot } from './client';
import { MSHeroBanner } from './components/hero-banner/client';
import { MSLargeQuote } from './components/large-quote/client';
import { MSProductsList } from './components/products-list/client';
import { MakeswiftPageShim } from './makeswift-page-shim';

export async function Page({ path, locale }: { path: string; locale: string }) {
  const snapshot = await getPageSnapshot({ path, locale });

  if (snapshot == null) {
    // This is a temporary solution to fix the issue where non-published pages are not editable in the builder.
    await connection();

    return notFound();
  }

  return (
    <>
      {path === '/pagedemo-1' && (
        <MSHeroBanner
          buttonLink={{ href: '/shop-all' }}
          buttonText="Shop Now"
          imageAlt="Hero background"
          imageSrc="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop"
          minHeight="medium"
          overlayOpacity={40}
          subtitle="Discover our latest collection of premium products"
          textAlign="center"
          textColor="light"
          title="Welcome to Our Store"
        />
      )}
      {path === '/pagedemo-1' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="best-selling"
          limit={8}
        />
      )}
      {path === '/blog' && (
        <div className="mx-auto max-w-4xl space-y-12 px-6 py-16">
          <MSLargeQuote
            accentColor="blue"
            author="Seth Godin"
            quote="People do not buy goods and services. They buy relations, stories, and magic."
            role="Marketing Author"
            size="x-large"
          />
          <MSLargeQuote
            accentColor="purple"
            author="Steve Jobs"
            quote="Design is not just what it looks like and feels like. Design is how it works."
            role="Co-founder, Apple"
            size="large"
          />
          <MSLargeQuote
            accentColor="green"
            author="Jeff Bezos"
            quote="Your brand is what other people say about you when you're not in the room."
            role="Founder, Amazon"
            size="large"
          />
        </div>
      )}
      {path === '/pagedemo-2' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="featured"
          limit={12}
        />
      )}
      {path === '/pagedemo-2' && (
        <div className="mx-auto max-w-4xl space-y-12 px-6 py-16">
          <MSLargeQuote
            accentColor="orange"
            author="Coco Chanel"
            quote="In order to be irreplaceable one must always be different."
            role="Fashion Designer"
            size="x-large"
          />
          <MSLargeQuote
            accentColor="red"
            author="Walt Disney"
            quote="The way to get started is to quit talking and begin doing."
            role="Founder, Disney"
            size="large"
          />
        </div>
      )}
      {path === '/flash-sale' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="best-selling"
          limit={12}
        />
      )}
      {path === '/page' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="newest"
          limit={10}
        />
      )}
      {path === '/test-1' && (
        <MSHeroBanner
          buttonLink={{ href: '/shop-all' }}
          buttonText="Explore Collection"
          imageAlt="Hero background"
          imageSrc="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=900&fit=crop"
          minHeight="large"
          overlayOpacity={50}
          subtitle="Handpicked items just for you"
          textAlign="center"
          textColor="light"
          title="The Best of Our Store"
        />
      )}
      {path === '/test-1' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="featured"
          limit={10}
        />
      )}
      {path === '/test-1' && (
        <div className="mx-auto max-w-4xl space-y-12 px-6 py-16">
          <MSLargeQuote
            accentColor="purple"
            author="Henry Ford"
            quote="Coming together is a beginning, staying together is progress, and working together is success."
            role="Founder, Ford Motor Company"
            size="x-large"
          />
          <MSLargeQuote
            accentColor="blue"
            author="Estée Lauder"
            quote="I never dreamed about success. I worked for it."
            role="Founder, Estée Lauder Companies"
            size="large"
          />
          <MSLargeQuote
            accentColor="green"
            author="Sam Walton"
            quote="There is only one boss. The customer. And he can fire everybody in the company from the chairman on down."
            role="Founder, Walmart"
            size="large"
          />
        </div>
      )}
      {path === '/test-2' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="best-selling"
          limit={10}
        />
      )}
      {path === '/test-3' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="newest"
          limit={10}
        />
      )}
      {path === '/' && (
        <MSProductsList
          additionalProducts={[]}
          className="mx-auto max-w-7xl px-6 py-12"
          collection="best-selling"
          limit={8}
        />
      )}
      <MakeswiftPageShim metadata={false} snapshot={snapshot} />
    </>
  );
}
