/**
 * migrate-content.ts
 *
 * Queries content from a BigCommerce staging channel and Makeswift staging site,
 * then publishes it to a BigCommerce production channel.
 *
 * Handles three content types:
 *   - Products  (via BC REST API v3 – catalog)
 *   - Categories (via BC REST API v3 – catalog trees)
 *   - Normal pages (via BC REST API v3 – content/pages)
 *
 * Makeswift pages are enumerated via the Makeswift SDK so the script can
 * report which paths are managed by Makeswift (those pages are published
 * through Makeswift's own publish flow, not replicated via REST).
 *
 * Usage:
 *   dotenv -e .env.local -- npx ts-node --esm scripts/migrate-content.ts
 *
 *   Or via the package.json script:
 *   npm run migrate-content
 *
 * Required environment variables (loaded from .env.local via dotenv-cli):
 *   BIGCOMMERCE_STORE_HASH
 *   BIGCOMMERCE_ACCESS_TOKEN        – store-level token with read/write scope
 *   BIGCOMMERCE_STAGING_CHANNEL_ID  – source channel
 *   BIGCOMMERCE_CHANNEL_ID          – target (production) channel
 *   MAKESWIFT_SITE_API_KEY          – Makeswift API key (for page enumeration)
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const STORE_HASH = requiredEnv('BIGCOMMERCE_STORE_HASH');
const ACCESS_TOKEN = requiredEnv('BIGCOMMERCE_ACCESS_TOKEN');
const STAGING_CHANNEL_ID = requiredEnv('BIGCOMMERCE_STAGING_CHANNEL_ID');
const PRODUCTION_CHANNEL_ID = requiredEnv('BIGCOMMERCE_CHANNEL_ID');
const MAKESWIFT_API_KEY = process.env.MAKESWIFT_SITE_API_KEY;

const API_HOST = process.env.BIGCOMMERCE_ADMIN_API_HOST ?? 'api.bigcommerce.com';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      total: number;
      count: number;
      current_page: number;
      total_pages: number;
    };
  };
}

async function bcFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `https://${API_HOST}/stores/${STORE_HASH}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Auth-Token': ACCESS_TOKEN,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');

    throw new Error(`BigCommerce API ${response.status} ${response.statusText}: ${path}\n${body}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

async function bcGet<T>(path: string): Promise<T> {
  return bcFetch<T>(path);
}

async function bcPost<T>(path: string, body: unknown): Promise<T> {
  return bcFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

async function bcPut<T>(path: string, body: unknown): Promise<T> {
  return bcFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function info(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[migrate] ${msg}`);
}

function warn(msg: string) {
  // eslint-disable-next-line no-console
  console.warn(`[migrate] ⚠ ${msg}`);
}

function fail(msg: string) {
  // eslint-disable-next-line no-console
  console.error(`[migrate] ✗ ${msg}`);
}

function ok(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[migrate] ✓ ${msg}`);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

interface BcProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  weight: number;
  type: string;
  description: string;
  categories: number[];
  is_visible: boolean;
  custom_url: { url: string; is_customized: boolean };
}

async function fetchAllProducts(channelId: string): Promise<BcProduct[]> {
  const products: BcProduct[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const resp = await bcGet<ApiResponse<BcProduct[]>>(
      `/v3/catalog/products?include=custom_url&is_visible=true&page=${page}&limit=250&channels:in=${channelId}`,
    );

    products.push(...resp.data);

    if (resp.meta?.pagination) {
      totalPages = resp.meta.pagination.total_pages;
    }

    page += 1;
  }

  return products;
}

async function migrateProducts(): Promise<{ migrated: number; skipped: number }> {
  info('Fetching staging products…');

  const stagingProducts = await fetchAllProducts(STAGING_CHANNEL_ID);

  info(`Found ${stagingProducts.length} product(s) on staging channel ${STAGING_CHANNEL_ID}.`);

  if (stagingProducts.length === 0) {
    return { migrated: 0, skipped: 0 };
  }

  // Products already live on production — look up by SKU to avoid duplicates.
  const prodProducts = await fetchAllProducts(PRODUCTION_CHANNEL_ID);
  const prodSkus = new Set(prodProducts.map((p) => p.sku));

  let migrated = 0;
  let skipped = 0;

  for (const product of stagingProducts) {
    if (prodSkus.has(product.sku)) {
      skipped += 1;
      continue;
    }

    // Assign the existing product to the production channel.
    await bcPut('/v3/catalog/products/channel-assignments', [
      {
        product_id: product.id,
        channel_id: Number(PRODUCTION_CHANNEL_ID),
      },
    ]);

    ok(`Product "${product.name}" (${product.sku}) → production channel.`);
    migrated += 1;
  }

  return { migrated, skipped };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

interface BcCategoryTree {
  id: number;
  name: string;
  channels: number[];
}

interface BcCategory {
  category_id: number;
  parent_id: number;
  name: string;
  description: string;
  is_visible: boolean;
  url: { path: string };
}

async function fetchCategoryTreeIds(channelId: string): Promise<number[]> {
  const resp = await bcGet<ApiResponse<BcCategoryTree[]>>(
    `/v3/catalog/trees?channel_id:in=${channelId}`,
  );

  return resp.data.map((t) => t.id);
}

async function fetchCategories(treeIds: number[]): Promise<BcCategory[]> {
  if (treeIds.length === 0) return [];

  const categories: BcCategory[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const resp = await bcGet<ApiResponse<BcCategory[]>>(
      `/v3/catalog/trees/categories?tree_id:in=${treeIds.join(',')}&is_visible=true&page=${page}&limit=250`,
    );

    categories.push(...resp.data);

    if (resp.meta?.pagination) {
      totalPages = resp.meta.pagination.total_pages;
    }

    page += 1;
  }

  return categories;
}

async function migrateCategories(): Promise<{ migrated: number; skipped: number }> {
  info('Fetching staging category trees…');

  const stagingTreeIds = await fetchCategoryTreeIds(STAGING_CHANNEL_ID);

  if (stagingTreeIds.length === 0) {
    warn('No category trees found on staging channel.');

    return { migrated: 0, skipped: 0 };
  }

  const stagingCategories = await fetchCategories(stagingTreeIds);

  info(`Found ${stagingCategories.length} categor(ies) on staging.`);

  // Fetch production categories to detect overlap.
  const prodTreeIds = await fetchCategoryTreeIds(PRODUCTION_CHANNEL_ID);
  const prodCategories = await fetchCategories(prodTreeIds);
  const prodCategoryNames = new Set(prodCategories.map((c) => c.name));

  let migrated = 0;
  let skipped = 0;

  // Category trees are shared across channels by assigning the tree to the
  // production channel.  Individual categories live within a tree, so we
  // assign the staging tree(s) to production if not already present.
  const prodTreeIdSet = new Set(prodTreeIds);

  for (const treeId of stagingTreeIds) {
    if (prodTreeIdSet.has(treeId)) {
      info(`Category tree ${treeId} already assigned to production — skipping assignment.`);
      continue;
    }

    await bcPut(`/v3/catalog/trees`, [
      { id: treeId, channels: [Number(STAGING_CHANNEL_ID), Number(PRODUCTION_CHANNEL_ID)] },
    ]);

    ok(`Category tree ${treeId} assigned to production channel.`);
  }

  for (const category of stagingCategories) {
    if (prodCategoryNames.has(category.name)) {
      skipped += 1;
      continue;
    }

    migrated += 1;
    ok(`Category "${category.name}" (${category.url.path}) available on production via tree.`);
  }

  return { migrated, skipped };
}

// ---------------------------------------------------------------------------
// Normal pages (web pages)
// ---------------------------------------------------------------------------

interface BcWebPage {
  id: number;
  name: string;
  type: string;
  is_visible: boolean;
  url?: string;
  body?: string;
  channel_id: number;
}

async function fetchPages(channelId: string): Promise<BcWebPage[]> {
  const pages: BcWebPage[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const resp = await bcGet<ApiResponse<BcWebPage[]>>(
      `/v3/content/pages?channel_id=${channelId}&include=body&limit=250&page=${page}`,
    );

    pages.push(...resp.data);

    if (resp.meta?.pagination) {
      totalPages = resp.meta.pagination.total_pages;
    }

    page += 1;
  }

  return pages;
}

async function migratePages(): Promise<{ migrated: number; skipped: number }> {
  info('Fetching staging web pages…');

  const stagingPages = await fetchPages(STAGING_CHANNEL_ID);

  info(`Found ${stagingPages.length} page(s) on staging channel ${STAGING_CHANNEL_ID}.`);

  if (stagingPages.length === 0) {
    return { migrated: 0, skipped: 0 };
  }

  const prodPages = await fetchPages(PRODUCTION_CHANNEL_ID);
  const prodPageNames = new Set(prodPages.map((p) => p.name));

  let migrated = 0;
  let skipped = 0;

  for (const stagingPage of stagingPages) {
    if (prodPageNames.has(stagingPage.name)) {
      skipped += 1;
      continue;
    }

    await bcPost<ApiResponse<BcWebPage>>('/v3/content/pages?include=body', {
      name: stagingPage.name,
      type: stagingPage.type,
      body: stagingPage.body ?? '',
      url: stagingPage.url,
      is_visible: stagingPage.is_visible,
      channel_id: Number(PRODUCTION_CHANNEL_ID),
    });

    ok(`Page "${stagingPage.name}" → production channel.`);
    migrated += 1;
  }

  return { migrated, skipped };
}

// ---------------------------------------------------------------------------
// Makeswift pages (informational — published via Makeswift UI)
// ---------------------------------------------------------------------------

interface MakeswiftPage {
  id: string;
  path: string;
  title?: string;
}

async function listMakeswiftPages(): Promise<MakeswiftPage[]> {
  if (!MAKESWIFT_API_KEY) {
    warn('MAKESWIFT_SITE_API_KEY not set — skipping Makeswift page enumeration.');

    return [];
  }

  // Dynamic import so the script can run without the full Next.js runtime.
  // The Makeswift client requires a `runtime` instance, so we import both.
  try {
    const { Makeswift } = await import('@makeswift/runtime/next');
    const { ReactRuntimeCore } = await import('@makeswift/runtime/react/core');
    const apiOrigin =
      process.env.NEXT_PUBLIC_MAKESWIFT_API_ORIGIN ?? process.env.MAKESWIFT_API_ORIGIN;
    const runtime = new ReactRuntimeCore();
    const client = new Makeswift(MAKESWIFT_API_KEY, {
      runtime,
      ...(apiOrigin ? { apiOrigin } : {}),
    });

    const pages: MakeswiftPage[] = [];

    for await (const page of client.getPages()) {
      pages.push({ id: page.id, path: page.path, title: page.title ?? undefined });
    }

    return pages;
  } catch (error) {
    warn(`Could not enumerate Makeswift pages: ${String(error)}`);

    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  info('=== Catalyst Content Migration ===');
  info(`Staging channel:    ${STAGING_CHANNEL_ID}`);
  info(`Production channel: ${PRODUCTION_CHANNEL_ID}`);
  info(`Store hash:         ${STORE_HASH}`);
  info('');

  // ------ Makeswift pages (report only) ------
  const makeswiftPages = await listMakeswiftPages();

  if (makeswiftPages.length > 0) {
    info(`Makeswift manages ${makeswiftPages.length} page(s):`);

    for (const page of makeswiftPages) {
      info(`  • ${page.path}${page.title ? ` — "${page.title}"` : ''}`);
    }

    info('These pages are published through the Makeswift builder, not via this script.');
    info('');
  }

  const makeswiftPaths = new Set(makeswiftPages.map((p) => p.path));

  // ------ Products ------
  const productResult = await migrateProducts();

  info(
    `Products: ${productResult.migrated} migrated, ${productResult.skipped} skipped (already on production).`,
  );
  info('');

  // ------ Categories ------
  const categoryResult = await migrateCategories();

  info(
    `Categories: ${categoryResult.migrated} migrated, ${categoryResult.skipped} skipped (already on production).`,
  );
  info('');

  // ------ Normal pages ------
  const pageResult = await migratePages();

  info(
    `Pages: ${pageResult.migrated} migrated, ${pageResult.skipped} skipped (already on production).`,
  );

  // ------ Hybrid region warnings ------
  // Cross-reference: warn about BC pages whose paths collide with Makeswift pages.
  // In the hybrid model individual regions on a page may be Makeswift-controlled
  // while others remain Page Builder-controlled. The migration script can only
  // move Page Builder content — Makeswift-controlled regions must be published
  // through the Makeswift editor (or a future Makeswift publish API).
  if (makeswiftPaths.size > 0) {
    info('');
    info('Hybrid region check:');

    const prodPages = await fetchPages(PRODUCTION_CHANNEL_ID);

    for (const page of prodPages) {
      if (page.url && makeswiftPaths.has(page.url)) {
        warn(
          `Page "${page.name}" (${page.url}) exists in both BigCommerce and Makeswift. ` +
            'Some regions may be Makeswift-controlled (hybrid page). ' +
            'Only Page Builder regions were migrated — Makeswift regions ' +
            'must be published via the Makeswift editor.',
        );
      }
    }
  }

  info('');
  info('=== Migration complete ===');
  info('');
  info('NOTE: This script migrates Page Builder content only. For pages using');
  info('the hybrid region model (some regions Makeswift, some Page Builder),');
  info('Makeswift-controlled regions are published through the Makeswift editor.');
  info('See: HybridRegionController and HybridRegion components for runtime behavior.');
}

main().catch((error) => {
  fail(String(error));
  process.exitCode = 1;
});
