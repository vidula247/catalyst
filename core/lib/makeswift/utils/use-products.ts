import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import useSWR from 'swr';
import { z } from 'zod';

import {
  BcProductSchema,
  Product,
  useBcProductToVibesProduct,
} from './use-bc-product-to-vibes-product/use-bc-product-to-vibes-product';

const ProductListSchema = z.object({
  products: z.array(BcProductSchema),
});

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then(ProductListSchema.parse);

interface Props {
  collection: string;
  collectionLimit?: number;
  additionalProductIds: string[];
}

function getCollectionUrl(collection: string, locale: string, limit: number): string | null {
  if (collection === 'none') return null;

  // Category-based collection: "category:<entityId>"
  if (collection.startsWith('category:')) {
    const categoryId = collection.split(':')[1];

    return `/api/products/category/${categoryId}?locale=${locale}&limit=${limit}`;
  }

  // Standard collections: best-selling, newest, featured
  return `/api/products/group/${collection}?locale=${locale}`;
}

export function useProducts({ collection, collectionLimit = 20, additionalProductIds }: Props): {
  products: Product[] | null;
  isLoading: boolean;
} {
  const bcProductToVibesProduct = useBcProductToVibesProduct();
  const locale = useLocale();

  const { data: collectionData, isLoading: isCollectionLoading } = useSWR(
    getCollectionUrl(collection, locale, collectionLimit),
    fetcher,
  );

  const searchParams = new URLSearchParams();

  searchParams.append('ids', additionalProductIds.join(','));
  searchParams.append('locale', locale);

  const additionalProductsUrl = `/api/products/ids?${searchParams.toString()}`;

  const { data: additionalData, isLoading: isAdditionalLoading } = useSWR(
    additionalProductIds.length ? additionalProductsUrl : null,
    fetcher,
  );
  const additionalProducts = useMemo(
    () =>
      additionalProductIds
        .map((id) => additionalData?.products.find((product) => product.entityId.toString() === id))
        .filter((product) => product != null),
    [additionalData, additionalProductIds],
  );

  const combinedProducts = useMemo(
    () => [...(collectionData?.products.slice(0, collectionLimit) ?? []), ...additionalProducts],
    [collectionData, additionalProducts, collectionLimit],
  );

  const isLoading = isCollectionLoading || isAdditionalLoading;

  const products = useMemo(
    () => (isLoading ? null : combinedProducts.map(bcProductToVibesProduct)),
    [isLoading, combinedProducts, bcProductToVibesProduct],
  );

  return { products, isLoading };
}
