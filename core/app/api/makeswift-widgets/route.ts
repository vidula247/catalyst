import { NextRequest, NextResponse } from 'next/server';

import {
  addElementToTree,
  createElementNode,
  getPageByPathname,
  getPageById,
  getSite,
  getPages,
  parseElementTree,
  publishPage,
  updateElementTree,
} from '~/lib/makeswift/api/makeswift-api-client';

/**
 * GET /api/makeswift-widgets?path=/pagedemo-1
 *
 * Lists all widgets on a Makeswift page.
 * If no path is provided, lists all pages.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.searchParams.get('path');

  try {
    if (!path) {
      const pages = await getPages();

      return NextResponse.json({
        status: 'success',
        pages: pages.map((p) => ({
          id: p.id,
          name: p.name,
          pathname: `/${p.pathname}`,
          isOnline: p.isOnline,
        })),
      });
    }

    const page = await getPageByPathname(path);

    if (!page) {
      return NextResponse.json(
        { status: 'error', error: `Page not found: ${path}` },
        { status: 404 },
      );
    }

    const deployment = page.deployment;

    if (!deployment) {
      return NextResponse.json({
        status: 'success',
        page: { id: page.id, name: page.name, pathname: `/${page.pathname}` },
        widgets: [],
      });
    }

    const tree = parseElementTree(deployment.data);
    const gridProp = tree.props.children as {
      value?: { elements?: Array<{ key: string; type: string; props: Record<string, unknown> }> };
    };

    const widgets = (gridProp?.value?.elements ?? []).map((el) => ({
      key: el.key,
      type: el.type,
      props: el.props,
    }));

    return NextResponse.json({
      status: 'success',
      page: { id: page.id, name: page.name, pathname: `/${page.pathname}` },
      widgets,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/makeswift-widgets
 *
 * Add a widget to a Makeswift page and optionally publish it.
 *
 * Body:
 * {
 *   "path": "/pagedemo-1",
 *   "widget": {
 *     "type": "primitive-products-carousel",
 *     "props": { "collection": "none", "categoryId": "19" }
 *   },
 *   "publish": true
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      path: string;
      widget: { type: string; props?: Record<string, unknown> };
      publish?: boolean;
    };

    if (!body.path || !body.widget?.type) {
      return NextResponse.json(
        { status: 'error', error: 'Required fields: path, widget.type' },
        { status: 400 },
      );
    }

    // 1. Find the page
    const page = await getPageByPathname(body.path);

    if (!page) {
      return NextResponse.json(
        { status: 'error', error: `Page not found: ${body.path}` },
        { status: 404 },
      );
    }

    if (!page.deployment) {
      return NextResponse.json(
        { status: 'error', error: `Page "${body.path}" has no deployment/element tree yet. Open it in the Makeswift editor first.` },
        { status: 400 },
      );
    }

    // 2. Parse current tree, add new element
    const tree = parseElementTree(page.deployment.data);
    const newElement = createElementNode(body.widget.type, body.widget.props ?? {});
    const updatedData = addElementToTree(tree, newElement);

    // 3. Update element tree via API
    const site = await getSite();
    await updateElementTree(page.deployment.id, site.id, updatedData);

    // 4. Publish if requested
    if (body.publish) {
      await publishPage(page.id);
    }

    // 4. Return success with the new widget info
    return NextResponse.json({
      status: 'success',
      message: `Widget "${body.widget.type}" added to page "${page.name}"${body.publish ? ' and published' : ''}`,
      widget: {
        key: newElement.key,
        type: newElement.type,
        props: newElement.props,
      },
      page: {
        id: page.id,
        name: page.name,
        pathname: `/${page.pathname}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 },
    );
  }
}
