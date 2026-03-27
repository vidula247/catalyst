import { NextRequest, NextResponse } from 'next/server';

import {
  getPageByPathname,
  publishPage,
} from '~/lib/makeswift/api/makeswift-api-client';

/**
 * POST /api/makeswift-widgets/publish
 *
 * Publish a Makeswift page, making all draft changes live on the storefront.
 *
 * Body:
 * {
 *   "path": "/pagedemo-1"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { path: string };

    if (!body.path) {
      return NextResponse.json(
        { status: 'error', error: 'Required field: path' },
        { status: 400 },
      );
    }

    const page = await getPageByPathname(body.path);

    if (!page) {
      return NextResponse.json(
        { status: 'error', error: `Page not found: ${body.path}` },
        { status: 404 },
      );
    }

    await publishPage(page.id);

    return NextResponse.json({
      status: 'success',
      message: `Page "${page.name}" (${body.path}) published successfully`,
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
