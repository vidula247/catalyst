/**
 * deploy-widgets.ts
 *
 * Programmatically injects widgets into Makeswift pages via the GraphQL API
 * and publishes them so they appear on the live sandbox URL.
 *
 * This replaces the hardcoded React components in page.tsx with
 * API-driven widget injection that persists in Makeswift's backend.
 *
 * Usage:
 *   # Against the live sandbox (default):
 *   DEPLOY_TARGET=https://store-lo0ml1e7g1-1842957.catalyst-sandbox-vercel.store npx tsx core/scripts/deploy-widgets.ts
 *
 *   # Against localhost:
 *   DEPLOY_TARGET=http://localhost:3000 npx tsx core/scripts/deploy-widgets.ts
 *
 * Environment:
 *   DEPLOY_TARGET — Base URL of the Catalyst app (required)
 *   MAKESWIFT_SITE_API_KEY — Only needed if calling the Makeswift API directly
 */

// ---------------------------------------------------------------------------
// Widget definitions — mirrors what was hardcoded in page.tsx
// ---------------------------------------------------------------------------

interface WidgetDef {
  type: string;
  props: Record<string, unknown>;
}

interface PageWidgets {
  path: string;
  widgets: WidgetDef[];
}

const PAGE_WIDGETS: PageWidgets[] = [
  {
    path: '/pagedemo-1',
    widgets: [
      {
        type: 'section-hero-banner',
        props: {
          title: 'Welcome to Our Store',
          subtitle: 'Discover our latest collection of premium products',
          imageSrc: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop',
          imageAlt: 'Hero background',
          buttonText: 'Shop Now',
          buttonLink: { href: '/shop-all' },
          textAlign: 'center',
          overlayOpacity: 40,
          minHeight: 'medium',
          textColor: 'light',
        },
      },
      {
        type: 'primitive-products-list',
        props: {
          collection: 'best-selling',
          limit: 8,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
    ],
  },
  {
    path: '/blog',
    widgets: [
      {
        type: 'section-large-quote',
        props: {
          quote: 'People do not buy goods and services. They buy relations, stories, and magic.',
          author: 'Seth Godin',
          role: 'Marketing Author',
          accentColor: 'blue',
          size: 'x-large',
        },
      },
      {
        type: 'section-large-quote',
        props: {
          quote: 'Design is not just what it looks like and feels like. Design is how it works.',
          author: 'Steve Jobs',
          role: 'Co-founder, Apple',
          accentColor: 'purple',
          size: 'large',
        },
      },
      {
        type: 'section-large-quote',
        props: {
          quote: 'Your brand is what other people say about you when you\'re not in the room.',
          author: 'Jeff Bezos',
          role: 'Founder, Amazon',
          accentColor: 'green',
          size: 'large',
        },
      },
    ],
  },
  {
    path: '/pagedemo-2',
    widgets: [
      {
        type: 'primitive-products-list',
        props: {
          collection: 'featured',
          limit: 12,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
      {
        type: 'section-large-quote',
        props: {
          quote: 'In order to be irreplaceable one must always be different.',
          author: 'Coco Chanel',
          role: 'Fashion Designer',
          accentColor: 'orange',
          size: 'x-large',
        },
      },
      {
        type: 'section-large-quote',
        props: {
          quote: 'The way to get started is to quit talking and begin doing.',
          author: 'Walt Disney',
          role: 'Founder, Disney',
          accentColor: 'red',
          size: 'large',
        },
      },
    ],
  },
  {
    path: '/flash-sale',
    widgets: [
      {
        type: 'primitive-products-list',
        props: {
          collection: 'best-selling',
          limit: 12,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
    ],
  },
  {
    path: '/page',
    widgets: [
      {
        type: 'primitive-products-list',
        props: {
          collection: 'newest',
          limit: 10,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
    ],
  },
  {
    path: '/test-1',
    widgets: [
      {
        type: 'section-hero-banner',
        props: {
          title: 'The Best of Our Store',
          subtitle: 'Handpicked items just for you',
          imageSrc: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=900&fit=crop',
          imageAlt: 'Hero background',
          buttonText: 'Explore Collection',
          buttonLink: { href: '/shop-all' },
          textAlign: 'center',
          overlayOpacity: 50,
          minHeight: 'large',
          textColor: 'light',
        },
      },
      {
        type: 'primitive-products-list',
        props: {
          collection: 'featured',
          limit: 10,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
      {
        type: 'section-large-quote',
        props: {
          quote: 'Coming together is a beginning, staying together is progress, and working together is success.',
          author: 'Henry Ford',
          role: 'Founder, Ford Motor Company',
          accentColor: 'purple',
          size: 'x-large',
        },
      },
      {
        type: 'section-large-quote',
        props: {
          quote: 'I never dreamed about success. I worked for it.',
          author: 'Estée Lauder',
          role: 'Founder, Estée Lauder Companies',
          accentColor: 'blue',
          size: 'large',
        },
      },
      {
        type: 'section-large-quote',
        props: {
          quote: 'There is only one boss. The customer. And he can fire everybody in the company from the chairman on down.',
          author: 'Sam Walton',
          role: 'Founder, Walmart',
          accentColor: 'green',
          size: 'large',
        },
      },
    ],
  },
  {
    path: '/test-2',
    widgets: [
      {
        type: 'primitive-products-list',
        props: {
          collection: 'best-selling',
          limit: 10,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
    ],
  },
  {
    path: '/test-3',
    widgets: [
      {
        type: 'primitive-products-list',
        props: {
          collection: 'newest',
          limit: 10,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
    ],
  },
  {
    path: '/',
    widgets: [
      {
        type: 'primitive-products-list',
        props: {
          collection: 'featured',
          limit: 12,
          additionalProducts: [],
          className: 'mx-auto max-w-7xl px-6 py-12',
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function getTarget(): string {
  const target = process.env.DEPLOY_TARGET;

  if (!target) {
    throw new Error(
      'DEPLOY_TARGET is required. Example:\n' +
      '  DEPLOY_TARGET=https://store-lo0ml1e7g1-1842957.catalyst-sandbox-vercel.store npx tsx core/scripts/deploy-widgets.ts',
    );
  }

  return target.replace(/\/$/, '');
}

async function addWidget(
  baseUrl: string,
  path: string,
  widget: WidgetDef,
  publish: boolean,
): Promise<{ status: string; message?: string; error?: string }> {
  const url = `${baseUrl}/api/makeswift-widgets`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, widget, publish }),
  });

  return (await response.json()) as { status: string; message?: string; error?: string };
}

async function publishPageByPath(
  baseUrl: string,
  path: string,
): Promise<{ status: string; message?: string; error?: string }> {
  const url = `${baseUrl}/api/makeswift-widgets/publish`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  return (await response.json()) as { status: string; message?: string; error?: string };
}

async function listPages(
  baseUrl: string,
): Promise<{ status: string; pages?: Array<{ pathname: string; name: string }> }> {
  const url = `${baseUrl}/api/makeswift-widgets`;
  const response = await fetch(url);

  return (await response.json()) as { status: string; pages?: Array<{ pathname: string; name: string }> };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[deploy-widgets] ${msg}`);
}

async function run() {
  const baseUrl = getTarget();

  log(`Target: ${baseUrl}`);
  log('');

  // Verify connectivity
  log('Checking connectivity...');

  const pagesResult = await listPages(baseUrl);

  if (pagesResult.status !== 'success') {
    throw new Error(`Cannot connect to ${baseUrl}/api/makeswift-widgets — is the app deployed?`);
  }

  const existingPages = new Set(
    (pagesResult.pages ?? []).map((p) => p.pathname),
  );

  log(`Found ${existingPages.size} pages in Makeswift`);
  log('');

  // Deploy widgets to each page
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const pageDef of PAGE_WIDGETS) {
    if (!existingPages.has(pageDef.path)) {
      log(`SKIP ${pageDef.path} — page not found in Makeswift (create it in the editor first)`);
      skipCount++;
      continue;
    }

    log(`--- ${pageDef.path} (${pageDef.widgets.length} widget(s)) ---`);

    for (let i = 0; i < pageDef.widgets.length; i++) {
      const widget = pageDef.widgets[i]!;
      const isLast = i === pageDef.widgets.length - 1;

      // Publish only on the last widget for each page
      const result = await addWidget(baseUrl, pageDef.path, widget, isLast);

      if (result.status === 'success') {
        log(`  + ${widget.type}${isLast ? ' (published)' : ''}`);
        successCount++;
      } else {
        log(`  x ${widget.type} — ${result.error ?? 'unknown error'}`);
        errorCount++;
      }
    }
  }

  log('');
  log('=== Summary ===');
  log(`  Widgets added: ${successCount}`);
  log(`  Pages skipped: ${skipCount}`);
  log(`  Errors: ${errorCount}`);
  log('');

  if (successCount > 0) {
    log(`Changes are live at: ${baseUrl}`);
  }
}

run().catch((error) => {
  log(`ERROR: ${String(error)}`);
  process.exitCode = 1;
});
