'use server';

import { removeEdgesAndNodes } from '@bigcommerce/catalyst-client';

import { client } from '~/client';
import { graphql } from '~/client/graphql';
import { revalidate } from '~/client/revalidate-target';

const SearchCategoriesQuery = graphql(`
  query SearchCategoriesQuery {
    site {
      categoryTree {
        entityId
        name
        path
        children {
          entityId
          name
          path
          children {
            entityId
            name
            path
          }
        }
      }
    }
  }
`);

interface CategoryOption {
  entityId: number;
  name: string;
  path: string;
}

export async function searchCategories(query: string): Promise<CategoryOption[]> {
  const { data } = await client.fetch({
    document: SearchCategoriesQuery,
    fetchOptions: { next: { revalidate } },
  });

  const tree = data.site.categoryTree;

  // Flatten the tree into a list
  const categories: CategoryOption[] = [];

  for (const node of tree) {
    categories.push({ entityId: node.entityId, name: node.name, path: node.path });

    for (const child of node.children) {
      categories.push({ entityId: child.entityId, name: child.name, path: child.path });

      for (const grandchild of child.children) {
        categories.push({
          entityId: grandchild.entityId,
          name: grandchild.name,
          path: grandchild.path,
        });
      }
    }
  }

  const lowerQuery = query.toLowerCase();

  return categories.filter((c) => c.name.toLowerCase().includes(lowerQuery));
}
