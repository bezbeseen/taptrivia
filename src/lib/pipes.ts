export type Shape = "I" | "L" | "T" | "X" | "none";

export type Cell = {
  shape: Shape;
  rot: number;
};

export type Puzzle = {
  cols: number;
  rows: number;
  cells: Cell[];
  start: number;
  end: number;
};

export const PIPE_COLS = 4;
export const PIPE_ROWS = 4;

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const OPP = [2, 3, 0, 1];

const BASE: Record<Exclude<Shape, "none">, [boolean, boolean, boolean, boolean]> = {
  I: [true, false, true, false],
  L: [true, true, false, false],
  T: [false, true, true, true],
  X: [true, true, true, true],
};

type Point = { x: number; y: number };

function indexOf(cols: number, x: number, y: number) {
  return y * cols + x;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export function cellOpenings(cell: Cell): [boolean, boolean, boolean, boolean] {
  if (cell.shape === "none") return [false, false, false, false];
  const base = BASE[cell.shape];
  const open: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  for (let dir = 0; dir < 4; dir++) {
    if (base[dir]) open[(dir + cell.rot) % 4] = true;
  }
  return open;
}

function openingMask(open: boolean[]): number {
  return open.reduce((mask, on, dir) => (on ? mask | (1 << dir) : mask), 0);
}

function fitShape(dirs: number[]): { shape: Shape; rot: number } {
  const want = [...new Set(dirs)].reduce((mask, dir) => mask | (1 << dir), 0);
  const shapes: Exclude<Shape, "none">[] = ["I", "L", "T", "X"];
  for (const shape of shapes) {
    for (let rot = 0; rot < 4; rot++) {
      if (openingMask(cellOpenings({ shape, rot })) === want) {
        return { shape, rot };
      }
    }
  }
  return { shape: "X", rot: 0 };
}

function dirBetween(from: Point, to: Point): number {
  if (to.x === from.x && to.y === from.y - 1) return 0;
  if (to.x === from.x + 1 && to.y === from.y) return 1;
  if (to.x === from.x && to.y === from.y + 1) return 2;
  return 3;
}

function walk(cols: number, rows: number, start: Point, end: Point): Point[] | null {
  const path: Point[] = [];
  const seen = new Set<string>();
  const key = (point: Point) => `${point.x},${point.y}`;

  const search = (point: Point): boolean => {
    path.push(point);
    seen.add(key(point));
    if (point.x === end.x && point.y === end.y) {
      return path.length >= 5 && path.length <= 9;
    }
    if (path.length >= 9) return false;
    for (const dir of shuffle([0, 1, 2, 3])) {
      const next = { x: point.x + DX[dir], y: point.y + DY[dir] };
      if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) continue;
      if (seen.has(key(next))) continue;
      if (search(next)) return true;
    }
    path.pop();
    seen.delete(key(point));
    return false;
  };

  return search(start) ? path : null;
}

function fallbackPath(start: Point, end: Point): Point[] {
  const path: Point[] = [{ ...start }];
  let x = start.x;
  let y = start.y;
  while (x !== end.x) {
    x += Math.sign(end.x - x);
    path.push({ x, y });
  }
  while (y !== end.y) {
    y += Math.sign(end.y - y);
    path.push({ x, y });
  }
  return path;
}

function pickPath(cols: number, rows: number, start: Point, end: Point): Point[] {
  let best: Point[] | null = null;
  for (let attempt = 0; attempt < 28; attempt++) {
    const path = walk(cols, rows, start, end);
    if (!path) continue;
    if (path.length >= 5 && path.length <= 9) return path;
    if (!best || path.length > best.length) best = path;
  }
  return best ?? fallbackPath(start, end);
}

export function flowing(puzzle: Puzzle): boolean[] {
  const { cols, rows, cells, start } = puzzle;
  const wet = Array.from({ length: cells.length }, () => false);
  const startOpen = cellOpenings(cells[start] ?? { shape: "none", rot: 0 });
  if (!startOpen[3]) return wet;

  const queue = [start];
  wet[start] = true;
  while (queue.length) {
    const current = queue.pop()!;
    const x = current % cols;
    const y = Math.floor(current / cols);
    const open = cellOpenings(cells[current] ?? { shape: "none", rot: 0 });
    for (let dir = 0; dir < 4; dir++) {
      if (!open[dir]) continue;
      const nx = x + DX[dir];
      const ny = y + DY[dir];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const next = indexOf(cols, nx, ny);
      const toward = cellOpenings(cells[next] ?? { shape: "none", rot: 0 });
      if (!toward[OPP[dir]]) continue;
      if (!wet[next]) {
        wet[next] = true;
        queue.push(next);
      }
    }
  }
  return wet;
}

export function isSolved(puzzle: Puzzle): boolean {
  const wet = flowing(puzzle);
  const end = puzzle.cells[puzzle.end];
  if (!end || !wet[puzzle.end]) return false;
  return cellOpenings(end)[1];
}

export function rotateCell(puzzle: Puzzle, index: number): Puzzle {
  const cells = puzzle.cells.map((cell, i) => {
    if (i !== index || cell.shape === "none") return cell;
    return { ...cell, rot: (cell.rot + 1) % 4 };
  });
  return { ...puzzle, cells };
}

function scramble(puzzle: Puzzle): Puzzle {
  let next: Puzzle = puzzle;
  for (let attempt = 0; attempt < 12; attempt++) {
    const cells = puzzle.cells.map((cell) => {
      if (cell.shape === "none") return cell;
      return { ...cell, rot: (cell.rot + 1 + Math.floor(Math.random() * 3)) % 4 };
    });
    next = { ...puzzle, cells };
    if (!isSolved(next)) return next;
  }
  return next;
}

export function createPuzzle(cols = PIPE_COLS, rows = PIPE_ROWS): Puzzle {
  const startPoint = { x: 0, y: Math.floor(Math.random() * rows) };
  const endPoint = { x: cols - 1, y: Math.floor(Math.random() * rows) };
  const path = pickPath(cols, rows, startPoint, endPoint);
  const onPath = new Set(path.map((point) => `${point.x},${point.y}`));
  const cells: Cell[] = Array.from({ length: cols * rows }, () => ({
    shape: "none" as Shape,
    rot: 0,
  }));

  path.forEach((point, i) => {
    const dirs: number[] = [];
    if (i === 0) dirs.push(3);
    if (i === path.length - 1) dirs.push(1);
    if (i > 0) dirs.push(dirBetween(point, path[i - 1]!));
    if (i < path.length - 1) dirs.push(dirBetween(point, path[i + 1]!));
    cells[indexOf(cols, point.x, point.y)] = fitShape(dirs);
  });

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (onPath.has(`${x},${y}`)) continue;
      if (Math.random() < 0.22) continue;
      const decoy: Shape = Math.random() < 0.55 ? "L" : Math.random() < 0.7 ? "I" : "T";
      cells[indexOf(cols, x, y)] = {
        shape: decoy,
        rot: Math.floor(Math.random() * 4),
      };
    }
  }

  const scrambled = scramble({
    cols,
    rows,
    cells,
    start: indexOf(cols, startPoint.x, startPoint.y),
    end: indexOf(cols, endPoint.x, endPoint.y),
  });
  if (!isSolved(scrambled)) return scrambled;
  return rotateCell(scrambled, scrambled.start);
}
