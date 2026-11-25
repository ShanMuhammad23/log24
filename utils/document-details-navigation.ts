export function documentDetailsHref(documentId: string) {
  return `/document-details/${documentId}` as const;
}
