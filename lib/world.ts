export type WorldPosition = {
  x: number;
  y: number;
};

const NEIGHBOR_OFFSETS: Array<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function getNewPosition(lastPosition?: WorldPosition | null): WorldPosition {
  if (!lastPosition) {
    return { x: 0, y: 0 };
  }

  const [dx, dy] = NEIGHBOR_OFFSETS[Math.floor(Math.random() * NEIGHBOR_OFFSETS.length)];

  return {
    x: lastPosition.x + dx,
    y: lastPosition.y + dy,
  };
}
