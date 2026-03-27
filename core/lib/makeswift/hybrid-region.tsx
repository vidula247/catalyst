import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { client } from '~/client';
import { graphql } from '~/client/graphql';
import { revalidate } from '~/client/revalidate-target';

import { getComponentSnapshot, getPageSnapshot } from './client';
import { MakeswiftComponentShim } from './makeswift-component-shim';
import { MakeswiftPageShim } from './makeswift-page-shim';

// ---------------------------------------------------------------------------
// BigCommerce Stencil rendered regions (Page Builder content)
// ---------------------------------------------------------------------------

const WebPageByRouteQuery = graphql(`
  query WebPageByRouteQuery($path: String!) {
    site {
      route(path: $path) {
        node {
          __typename
          ... on NormalPage {
            renderedRegions {
              regions {
                name
                html
              }
            }
          }
          ... on ContactPage {
            renderedRegions {
              regions {
                name
                html
              }
            }
          }
          ... on BlogIndexPage {
            renderedRegions {
              regions {
                name
                html
              }
            }
          }
        }
      }
    }
  }
`);

interface StencilRegionData {
  name: string;
  html: string;
}

async function getStencilRegions(path: string): Promise<StencilRegionData[]> {
  try {
    const { data } = await client.fetch({
      document: WebPageByRouteQuery,
      variables: { path },
      fetchOptions: { next: { revalidate } },
    });

    const node = data.site.route?.node;

    if (
      node?.__typename === 'NormalPage' ||
      node?.__typename === 'ContactPage' ||
      node?.__typename === 'BlogIndexPage'
    ) {
      return node.renderedRegions.regions;
    }

    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// HybridRegion — per-region component
//
// Renders a single named region. If a Makeswift component snapshot exists for
// the region, it renders the Makeswift component. Otherwise it falls back to
// the Page Builder (Stencil) rendered HTML for that region.
//
// This matches the model described by BigCommerce: each region on a page can
// independently be Makeswift-controlled or Page Builder-controlled. A merchant
// can uncheck "Use Page Builder content" on a region to hand it to Makeswift,
// while other regions on the same page remain Page Builder-controlled.
// ---------------------------------------------------------------------------

interface HybridRegionProps {
  /** Makeswift component snapshot ID for this region (if Makeswift controls it). */
  snapshotId?: string;
  /** Makeswift component type identifier for this region. */
  type?: string;
  /** Label shown in the Makeswift editor for this region. */
  label: string;
  /** Pre-fetched Page Builder HTML for this region (the fallback content). */
  fallbackHtml?: string;
}

/**
 * Renders a single region as either Makeswift content or Page Builder content.
 *
 * - If `snapshotId` is provided and a valid Makeswift snapshot exists,
 *   the region is Makeswift-controlled and renders via Makeswift.
 * - Otherwise the region falls back to Page Builder content (`fallbackHtml`).
 */
export async function HybridRegion({
  snapshotId,
  type: componentType,
  label,
  fallbackHtml,
}: HybridRegionProps) {
  if (snapshotId) {
    const snapshot = await getComponentSnapshot(snapshotId);

    if (snapshot != null) {
      return (
        <MakeswiftComponentShim
          label={label}
          snapshot={snapshot}
          type={componentType ?? `hybrid-region-${label}`}
        />
      );
    }
  }

  // "Use Page Builder content" fallback — render the Stencil region HTML
  if (fallbackHtml) {
    return (
      <section
        className="stencil-region"
        dangerouslySetInnerHTML={{ __html: fallbackHtml }}
        data-region={label}
      />
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// HybridRegionController — page-level orchestrator
//
// Used in the catch-all route. For a given page path it:
//   1. Checks if Makeswift owns the entire page (full page snapshot).
//   2. If not, fetches Page Builder regions from BigCommerce and renders them.
//      Individual regions can be overridden by Makeswift via the `regionOverrides`
//      map, allowing the per-region hybrid model.
// ---------------------------------------------------------------------------

interface RegionOverride {
  /** Makeswift component snapshot ID that takes over this region. */
  snapshotId: string;
}

interface HybridRegionControllerProps {
  path: string;
  locale: string;
  /**
   * Optional map of region name → Makeswift snapshot ID.
   * When a region name appears in this map, Makeswift content is rendered
   * for that region instead of the Page Builder HTML. Regions not listed
   * fall back to Page Builder content.
   */
  regionOverrides?: Record<string, RegionOverride>;
  /**
   * Optional children to inject into the page below all regions.
   * Use this to programmatically place widgets (e.g. a Products Carousel)
   * on a page that Makeswift doesn't yet support via its API.
   */
  children?: React.ReactNode;
}

export async function HybridRegionController({
  path,
  locale,
  regionOverrides = {},
  children,
}: HybridRegionControllerProps) {
  // 1. Check if Makeswift owns the entire page
  const snapshot = await getPageSnapshot({ path, locale });

  if (snapshot != null) {
    return (
      <>
        <MakeswiftPageShim metadata={false} snapshot={snapshot} />
        {children}
      </>
    );
  }

  // 2. Fetch Page Builder regions from BigCommerce
  await connection();

  const stencilRegions = await getStencilRegions(path);

  if (stencilRegions.length === 0 && Object.keys(regionOverrides).length === 0) {
    return notFound();
  }

  // Build a set of region names we've already rendered (from BC data)
  const renderedRegionNames = new Set(stencilRegions.map((r) => r.name));

  return (
    <div className="hybrid-regions" data-page-path={path}>
      {/* Render each Stencil region, substituting Makeswift overrides where present */}
      {stencilRegions.map((region) => {
        const override = regionOverrides[region.name];

        return (
          <HybridRegion
            fallbackHtml={region.html}
            key={region.name}
            label={region.name}
            snapshotId={override?.snapshotId}
          />
        );
      })}

      {/* Render Makeswift-only regions that don't exist in Page Builder */}
      {Object.entries(regionOverrides)
        .filter(([name]) => !renderedRegionNames.has(name))
        .map(([name, override]) => (
          <HybridRegion key={name} label={name} snapshotId={override.snapshotId} />
        ))}

      {/* Programmatically injected widgets */}
      {children}
    </div>
  );
}
