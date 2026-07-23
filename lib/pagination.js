export function paginationItems(currentPage, totalPages, maxItems = 7) {
  const total = Math.max(0, Math.floor(Number(totalPages) || 0));
  if (!total) return [];
  const current = Math.min(total, Math.max(1, Math.floor(Number(currentPage) || 1)));
  const max = Math.max(5, Math.floor(Number(maxItems) || 7));
  if (total <= max) return Array.from({ length: total }, (_, index) => index + 1);

  const siblings = Math.max(0, Math.floor((max - 5) / 2));
  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);

  if (left <= 2) {
    const end = max - 2;
    return [...Array.from({ length: end }, (_, index) => index + 1), 'ellipsis', total];
  }
  if (right >= total - 1) {
    const start = total - (max - 3);
    return [1, 'ellipsis', ...Array.from({ length: total - start + 1 }, (_, index) => start + index)];
  }
  return [
    1,
    'ellipsis',
    ...Array.from({ length: right - left + 1 }, (_, index) => left + index),
    'ellipsis',
    total
  ];
}
