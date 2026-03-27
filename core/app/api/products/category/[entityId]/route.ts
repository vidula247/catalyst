import { NextRequest, NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';

import { getProductsByCategoryId } from '~/client/queries/get-products';
import { routing } from '~/i18n/routing';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ entityId: string }> },
) => {
  const { entityId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') ?? routing.defaultLocale;
  const limit = parseInt(searchParams.get('limit') ?? '12', 10);

  if (!hasLocale(routing.locales, locale)) {
    return NextResponse.json(
      { status: 'error', error: 'Invalid locale parameter' },
      { status: 400 },
    );
  }

  const categoryEntityId = parseInt(entityId, 10);

  if (Number.isNaN(categoryEntityId)) {
    return NextResponse.json(
      { status: 'error', error: 'Invalid entityId parameter' },
      { status: 400 },
    );
  }

  const result = await getProductsByCategoryId({
    categoryEntityId,
    first: limit,
    locale,
  });

  return NextResponse.json(result);
};
