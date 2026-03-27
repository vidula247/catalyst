/**
 * Makeswift GraphQL API Client
 *
 * Provides programmatic access to Makeswift's GraphQL API for:
 *   - Querying site and page data
 *   - Updating page element trees (adding/removing widgets)
 *   - Publishing pages
 *
 * This uses the same API that the Makeswift editor uses internally.
 */

const API_ENDPOINT = 'https://api.makeswift.com/graphql';

function getApiKey(): string {
  const key = process.env.MAKESWIFT_SITE_API_KEY;

  if (!key) {
    throw new Error('MAKESWIFT_SITE_API_KEY is required');
  }

  return key;
}

async function gql<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) {
    throw new Error(`Makeswift API error: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

interface MakeswiftSite {
  id: string;
  name: string;
}

interface MakeswiftPage {
  id: string;
  name: string;
  pathname: string;
  isOnline: boolean;
  collection: { id: string; name: string };
  deployment: { id: string; data: string; version: number } | null;
}

export async function getSite(): Promise<MakeswiftSite> {
  const data = await gql<{ siteByApiKey: MakeswiftSite }>(
    `query GetSite($apiKey: String!) { siteByApiKey(apiKey: $apiKey) { id name } }`,
    { apiKey: getApiKey() },
  );

  return data.siteByApiKey;
}

export async function getPages(): Promise<MakeswiftPage[]> {
  const data = await gql<{
    siteByApiKey: { pages: { edges: Array<{ node: MakeswiftPage }> } };
  }>(
    `query GetPages($apiKey: String!) {
      siteByApiKey(apiKey: $apiKey) {
        pages(first: 100) {
          edges {
            node {
              id name pathname isOnline
              collection { id name }
              deployment { id data version }
            }
          }
        }
      }
    }`,
    { apiKey: getApiKey() },
  );

  return data.siteByApiKey.pages.edges.map((e) => e.node);
}

export async function getPageByPathname(pathname: string): Promise<MakeswiftPage | null> {
  const normalized = pathname.replace(/^\/|\/$/g, '');
  const pages = await getPages();

  return pages.find((p) => p.pathname === normalized) ?? null;
}

export async function getPageById(pageId: string): Promise<MakeswiftPage> {
  const data = await gql<{ page: MakeswiftPage }>(
    `query GetPage($id: ID!) {
      page(id: $id) {
        id name pathname isOnline
        collection { id name }
        deployment { id data version }
      }
    }`,
    { id: pageId },
  );

  return data.page;
}

// ---------------------------------------------------------------------------
// Element tree helpers
// ---------------------------------------------------------------------------

export interface ElementNode {
  key: string;
  type: string;
  props: Record<string, unknown>;
}

export interface ElementTree {
  key: string;
  type: string;
  props: Record<string, unknown>;
}

/**
 * Parse the deployment data JSON string into an element tree object.
 */
export function parseElementTree(deploymentData: string): ElementTree {
  return JSON.parse(deploymentData) as ElementTree;
}

/**
 * Create a new element node for a registered Makeswift component.
 */
export function createElementNode(
  componentType: string,
  props: Record<string, unknown> = {},
): ElementNode {
  return {
    key: crypto.randomUUID(),
    type: componentType,
    props,
  };
}

/**
 * Add an element to the root grid of a page's element tree.
 * Returns the modified tree as a JSON string.
 */
export function addElementToTree(tree: ElementTree, element: ElementNode): string {
  const gridProp = tree.props.children as {
    '@@makeswift/type': string;
    value: { columns: unknown[]; elements: ElementNode[] };
  };

  if (gridProp?.value?.elements) {
    gridProp.value.elements.push(element);
  }

  return JSON.stringify(tree);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Update the element tree (content) of a page.
 */
export async function updateElementTree(
  elementTreeId: string,
  siteId: string,
  data: string,
): Promise<void> {
  await gql(
    `mutation UpdateElementTree($input: UpdateElementTreeInput!) {
      updateElementTree(input: $input) { elementTree { id } }
    }`,
    {
      input: {
        id: elementTreeId,
        siteId,
        data: JSON.parse(data),
      },
    },
  );
}

/**
 * Publish a page by its ID, making draft changes live on the storefront.
 */
export async function publishPage(pageId: string): Promise<void> {
  await gql(
    `mutation PublishPage($input: PublishInput!) {
      publish(input: $input) { page { id } }
    }`,
    {
      input: {
        pageId,
        message: 'Published via API',
      },
    },
  );
}

/**
 * Publish all pending changes for a site.
 */
export async function publishAllChanges(siteId: string): Promise<void> {
  await gql(
    `mutation PublishChanges($input: PublishChangesInput!) {
      publishChanges(input: $input) { siteVersion { id } }
    }`,
    {
      input: { siteId },
    },
  );
}
