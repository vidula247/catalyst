import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const authToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;

  if (!authToken) {
    // eslint-disable-next-line no-console
    console.log(
      '[BigCommerce] Provide a store-level API token with "read-only" scope for Content to query the Widget Templates API: https://support.bigcommerce.com/s/article/Store-API-Accounts#creating',
    );

    return NextResponse.json(null, { status: 403 });
  }

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/content/widget-templates`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch widget templates: ${response.statusText}`);
  }

  const jsonResponse: unknown = await response.json();

  return NextResponse.json(jsonResponse);
}
