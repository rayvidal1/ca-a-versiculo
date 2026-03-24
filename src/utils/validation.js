import { getCellKey } from './wordSearch.js';

function sameSequence(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

export function findMatchedPlacement(selection, placements, foundWordSet) {
  if (!selection.length) {
    return null;
  }

  const selectionKeys = selection.map(getCellKey);

  for (const placement of placements) {
    if (foundWordSet.has(placement.word)) {
      continue;
    }

    const placementKeys = placement.cells.map(getCellKey);

    if (
      sameSequence(selectionKeys, placementKeys) ||
      sameSequence(selectionKeys, [...placementKeys].reverse())
    ) {
      return placement;
    }
  }

  return null;
}

export function buildCellMap(placements) {
  return placements.reduce((map, placement) => {
    placement.cells.forEach((cell) => {
      map[getCellKey(cell)] = {
        word: placement.word,
        color: placement.color,
      };
    });

    return map;
  }, {});
}
