'use client';

import { ComponentPropsWithoutRef } from 'react';

import { ProductList, ProductListSkeleton } from '@/vibes/soul/sections/product-list';

import { useProducts } from '../../utils/use-products';

type MSProductsListProps = Omit<ComponentPropsWithoutRef<typeof ProductList>, 'products'> & {
  className: string;
  collection: 'none' | 'best-selling' | 'newest' | 'featured';
  categoryId?: string;
  limit: number;
  additionalProducts: Array<{
    entityId?: string;
  }>;
};

export function MSProductsList({
  className,
  collection,
  categoryId,
  limit,
  additionalProducts,
  ...props
}: MSProductsListProps) {
  const additionalProductIds = additionalProducts.map(({ entityId }) => entityId ?? '');
  const effectiveCollection = categoryId ? `category:${categoryId}` : collection;
  const { products, isLoading } = useProducts({
    collection: effectiveCollection,
    collectionLimit: limit,
    additionalProductIds,
  });

  if (isLoading) {
    return <ProductListSkeleton className={className} />;
  }

  if (products == null || products.length === 0) {
    return <ProductListSkeleton className={className} />;
  }

  return <ProductList {...props} className={className} products={products} />;
}
