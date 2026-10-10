/** Does an item tagged with `pathway` belong to the selected path? Tolerates missing or non-string tags. */
export function matchesPath(pathway: unknown, selectedPath: string | null | undefined): boolean {
  if (!selectedPath) return true
  if (typeof pathway !== 'string' || !pathway) return false
  if (pathway === selectedPath) return true
  const head = selectedPath.split('/')[0].trim().toLowerCase()
  return head.length > 0 && pathway.toLowerCase().includes(head)
}
