export function masonryColumns({ availableWidth, minCardWidth, gap = 16 } = {}) {
  const minimumWidth = Math.max(1, Number(minCardWidth) || 1);
  const space = Math.max(0, Number(gap) || 0);
  const available = Math.max(minimumWidth, Number(availableWidth) || minimumWidth);
  const columnCount = Math.max(1, Math.floor((available + space) / (minimumWidth + space)));
  const cardWidth = (available - (columnCount - 1) * space) / columnCount;
  return { columnCount, cardWidth, width: available };
}

export function masonryLayout(cardHeights, {
  columnCount = 1,
  cardWidth,
  gap = 16
} = {}) {
  const width = Math.max(1, Number(cardWidth) || 1);
  const space = Math.max(0, Number(gap) || 0);
  const columns = Math.max(1, Math.floor(Number(columnCount) || 1));
  const columnHeights = Array(columns).fill(0);
  const positions = [];

  for (const rawHeight of cardHeights || []) {
    let targetColumn = 0;
    for (let index = 1; index < columnHeights.length; index += 1) {
      if (columnHeights[index] < columnHeights[targetColumn]) targetColumn = index;
    }
    positions.push({
      column: targetColumn,
      x: targetColumn * (width + space),
      y: columnHeights[targetColumn]
    });
    columnHeights[targetColumn] += Math.max(0, Number(rawHeight) || 0) + space;
  }

  return {
    columnCount: columns,
    width: columns * width + (columns - 1) * space,
    height: positions.length ? Math.max(...columnHeights) - space : 0,
    positions
  };
}
