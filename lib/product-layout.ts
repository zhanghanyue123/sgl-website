export const PRODUCTS_PER_ROW = 4;

export function splitIntoProductRows<T>(items: readonly T[], rowSize = PRODUCTS_PER_ROW): T[][] {
  if (!Number.isInteger(rowSize) || rowSize < 1) {
    throw new Error("rowSize must be a positive integer");
  }

  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += rowSize) {
    rows.push(items.slice(index, index + rowSize));
  }
  return rows;
}
