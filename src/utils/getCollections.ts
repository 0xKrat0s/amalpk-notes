import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

type CollectionNode = {
  path: string;
  name: string;
  label: string;
  depth: number;
  postCount: number;
};

const getSegments = (collection: string) =>
  collection
    .split("/")
    .map(segment => segment.trim())
    .filter(Boolean);

export const normalizeCollection = (collection: string) =>
  getSegments(collection)
    .map(segment => slugifyStr(segment))
    .join("/");

/**
 * Builds a sorted, flattened hierarchy of collections from post metadata.
 * Parent counts include posts assigned to all nested collections.
 */
export function getUniqueCollections(posts: CollectionEntry<"posts">[]) {
  const collections = new Map<string, CollectionNode>();

  posts.filter(postFilter).forEach(post => {
    const segments = getSegments(post.data.collection);
    const slugs = segments.map(segment => slugifyStr(segment));

    segments.forEach((segment, index) => {
      const path = slugs.slice(0, index + 1).join("/");
      const existing = collections.get(path);

      if (existing) {
        existing.postCount += 1;
        return;
      }

      collections.set(path, {
        path,
        name: segment,
        label: segments.slice(0, index + 1).join(" / "),
        depth: index,
        postCount: 1,
      });
    });
  });

  return [...collections.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export function getPostsForCollection(
  posts: CollectionEntry<"posts">[],
  collectionPath: string
) {
  const normalizedPath = normalizeCollection(collectionPath);

  return posts.filter(post => {
    const postPath = normalizeCollection(post.data.collection);
    return (
      postFilter(post) &&
      (postPath === normalizedPath || postPath.startsWith(`${normalizedPath}/`))
    );
  });
}
