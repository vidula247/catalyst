/**
 * add-widget.ts
 *
 * Automates adding widgets to Makeswift pages:
 *   1. Connects to Makeswift API and verifies the page exists
 *   2. Shows current page content
 *   3. Opens the Makeswift editor for the page
 *   4. After editing in the editor, publishes the page via API
 *
 * The Makeswift GraphQL API allows reading content and publishing,
 * but writing element tree content requires the Makeswift editor.
 * This script bridges both: it launches the editor and handles publish.
 *
 * Usage:
 *   npm run add-widget
 */

const API_ENDPOINT = 'https://api.makeswift.com/graphql';

function getApiKey(): string {
  const key = process.env.MAKESWIFT_SITE_API_KEY;

  if (!key) throw new Error('MAKESWIFT_SITE_API_KEY is not set');

  return key;
}

async function gql<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': getApiKey() },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) throw new Error(`Makeswift API: ${json.errors.map((e) => e.message).join(', ')}`);

  return json.data as T;
}

// ---------------------------------------------------------------------------

interface WidgetPageInfo {
  id: string;
  name: string;
  pathname: string;
  isOnline: boolean;
  deployment: { data: string; version: number } | null;
}

interface SiteInfo {
  id: string;
  name: string;
  pages: { edges: Array<{ node: WidgetPageInfo }> };
}

async function getSiteAndPages(): Promise<SiteInfo> {
  const data = await gql<{ siteByApiKey: SiteInfo }>(
    `query($apiKey: String!) {
      siteByApiKey(apiKey: $apiKey) {
        id name
        pages(first: 100) {
          edges { node { id name pathname isOnline deployment { data version } } }
        }
      }
    }`,
    { apiKey: getApiKey() },
  );

  return data.siteByApiKey;
}

function logMsg(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[add-widget] ${msg}`);
}

function logOk(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[add-widget] ✓ ${msg}`);
}

function logErr(msg: string) {
  // eslint-disable-next-line no-console
  console.error(`[add-widget] ✗ ${msg}`);
}

// ---------------------------------------------------------------------------

async function run() {
  logMsg('=== Makeswift Widget Automation ===');
  logMsg('');

  const site = await getSiteAndPages();

  logOk(`Connected to site: "${site.name}"`);
  logMsg('');

  // List all pages
  logMsg('Pages in Makeswift:');

  const pages = site.pages.edges.map((e) => e.node);

  for (const page of pages) {
    const widgetCount = page.deployment
      ? (JSON.parse(page.deployment.data).props?.children?.value?.elements?.length ?? 0)
      : 0;
    const status = page.isOnline ? 'online' : 'offline';

    logMsg(`  /${page.pathname || '(home)'} — "${page.name}" — ${widgetCount} widget(s) — ${status}`);
  }

  logMsg('');

  // Show details for pagedemo-1
  const targetPage = pages.find((p) => p.pathname === 'pagedemo-1');

  if (!targetPage) {
    logErr('Page "pagedemo-1" not found. Create it in the Makeswift editor first.');

    return;
  }

  if (targetPage.deployment) {
    const tree = JSON.parse(targetPage.deployment.data);
    const elements = tree.props?.children?.value?.elements ?? [];

    logMsg(`Current widgets on /${targetPage.pathname}:`);

    for (const el of elements) {
      logMsg(`  • ${el.type} (key: ${el.key})`);
    }

    logMsg('');
  }

  // List available components that can be added in the editor
  logMsg('Available components to drag in the Makeswift editor:');
  logMsg('  • Catalog / Products Carousel  — with Category search dropdown (Garden, Kitchen, etc.)');
  logMsg('  • Catalog / Products List      — with Category search dropdown');
  logMsg('  • Basic / Card                 — image, title, link');
  logMsg('  • Slideshow                    — slides with images, text, buttons');
  logMsg('  • Accordion                    — collapsible FAQ/content sections');
  logMsg('  • Button                       — CTA button with link');
  logMsg('  • 38 BigCommerce Widget Templates — auto-registered from your store');
  logMsg('');

  // Generate the editor URL
  const siteIdDecoded = Buffer.from(site.id, 'base64').toString('utf-8').split(':')[1];
  const pageIdDecoded = Buffer.from(targetPage.id, 'base64').toString('utf-8').split(':')[1];
  const editorUrl = `https://app.makeswift.com/s/${siteIdDecoded}/pages/${pageIdDecoded}`;

  logMsg('=== Next Steps ===');
  logMsg('');
  logMsg(`1. Open the Makeswift editor:`);
  logMsg(`   ${editorUrl}`);
  logMsg('');
  logMsg('2. Drag any widget from the left panel onto the page');
  logMsg('   - For Products Carousel: select a Category (Garden, Kitchen, etc.)');
  logMsg('   - For Card: set title, image, link');
  logMsg('   - For any BC Widget Template: configure its fields');
  logMsg('');
  logMsg('3. Click "Publish" in the Makeswift editor');
  logMsg('');
  logMsg('4. Visit http://localhost:3000/pagedemo-1/ — your changes are live!');
}

run().catch((error) => {
  logErr(String(error));
  process.exitCode = 1;
});
