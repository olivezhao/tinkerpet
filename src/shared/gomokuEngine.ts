import {
  createEmptyBoard,
  GOMOKU_BOARD_SIZE,
  type GomokuGameResult,
  type GomokuGameState,
  type GomokuSide
} from "./gameTypes"

const DIRECTIONS: Array<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
]

function cloneBoard(board: GomokuGameState["board"]): GomokuGameState["board"] {
  return board.map((row) => [...row])
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GOMOKU_BOARD_SIZE && y >= 0 && y < GOMOKU_BOARD_SIZE
}

function countContinuous(
  board: GomokuGameState["board"],
  x: number,
  y: number,
  dx: number,
  dy: number,
  side: GomokuSide
): number {
  let count = 0
  let cx = x + dx
  let cy = y + dy

  while (inBounds(cx, cy) && board[cy][cx] === side) {
    count += 1
    cx += dx
    cy += dy
  }

  return count
}

function isBoardFull(board: GomokuGameState["board"]): boolean {
  return board.every((row) => row.every((cell) => cell !== 0))
}

export function createGomokuGameState(
  difficulty: GomokuGameState["difficulty"] = "normal"
): GomokuGameState {
  const now = Date.now()
  return {
    board: createEmptyBoard(),
    currentTurn: 1,
    difficulty,
    id: `game_${now}`,
    moveCount: 0,
    moves: [],
    result: "ongoing",
    startedAt: now,
    updatedAt: now
  }
}

export function evaluateMoveResult(
  board: GomokuGameState["board"],
  x: number,
  y: number,
  side: GomokuSide
): GomokuGameResult {
  for (const [dx, dy] of DIRECTIONS) {
    const lineCount =
      1 +
      countContinuous(board, x, y, dx, dy, side) +
      countContinuous(board, x, y, -dx, -dy, side)
    if (lineCount >= 5) {
      return side === 1 ? "player_win" : "tinker_win"
    }
  }

  if (isBoardFull(board)) {
    return "draw"
  }

  return "ongoing"
}

export function applyGomokuMove(
  state: GomokuGameState,
  x: number,
  y: number,
  side: GomokuSide
): GomokuGameState {
  if (state.result !== "ongoing") {
    throw new Error("Game already ended")
  }
  if (!inBounds(x, y)) {
    throw new Error("Move out of board range")
  }
  if (side !== state.currentTurn) {
    throw new Error("Not this side's turn")
  }
  if (state.board[y][x] !== 0) {
    throw new Error("Cell already occupied")
  }

  const nextBoard = cloneBoard(state.board)
  nextBoard[y][x] = side
  const nextResult = evaluateMoveResult(nextBoard, x, y, side)
  const now = Date.now()

  return {
    ...state,
    board: nextBoard,
    currentTurn: nextResult === "ongoing" ? (side === 1 ? 2 : 1) : state.currentTurn,
    moveCount: state.moveCount + 1,
    moves: [...state.moves, { side, x, y }],
    result: nextResult,
    updatedAt: now
  }
}

export function runGomokuEngineSelfCheck(): boolean {
  // case 1: init state
  const g1 = createGomokuGameState("easy")
  if (g1.board.length !== GOMOKU_BOARD_SIZE || g1.board[0]?.length !== GOMOKU_BOARD_SIZE) {
    return false
  }

  // case 2: legal move
  const g2 = applyGomokuMove(g1, 7, 7, 1)
  if (g2.board[7][7] !== 1 || g2.currentTurn !== 2) {
    return false
  }

  // case 3: cannot override
  try {
    applyGomokuMove(g2, 7, 7, 2)
    return false
  } catch {
    // expected
  }

  // case 4: horizontal win
  let h = createGomokuGameState()
  for (let i = 0; i < 4; i += 1) {
    h = applyGomokuMove(h, i, 0, 1)
    h = applyGomokuMove(h, i, 1, 2)
  }
  h = applyGomokuMove(h, 4, 0, 1)
  if (h.result !== "player_win") {
    return false
  }

  // case 5: vertical win
  let v = createGomokuGameState()
  for (let i = 0; i < 4; i += 1) {
    v = applyGomokuMove(v, 0, i, 1)
    v = applyGomokuMove(v, 1, i, 2)
  }
  v = applyGomokuMove(v, 0, 4, 1)
  if (v.result !== "player_win") {
    return false
  }

  // case 6: diagonal \ win
  let d1 = createGomokuGameState()
  for (let i = 0; i < 4; i += 1) {
    d1 = applyGomokuMove(d1, i, i, 1)
    d1 = applyGomokuMove(d1, i + 1, i, 2)
  }
  d1 = applyGomokuMove(d1, 4, 4, 1)
  if (d1.result !== "player_win") {
    return false
  }

  // case 7: diagonal / win
  let d2 = createGomokuGameState()
  for (let i = 0; i < 4; i += 1) {
    d2 = applyGomokuMove(d2, i, 4 - i, 1)
    d2 = applyGomokuMove(d2, i + 1, 4 - i, 2)
  }
  d2 = applyGomokuMove(d2, 4, 0, 1)
  if (d2.result !== "player_win") {
    return false
  }

  // case 8: draw check using direct board eval
  const drawBoard = createEmptyBoard()
  for (let y = 0; y < GOMOKU_BOARD_SIZE; y += 1) {
    for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
      drawBoard[y][x] = ((x + y) % 2 === 0 ? 1 : 2) as GomokuSide
    }
  }
  drawBoard[7][7] = 2
  const drawResult = evaluateMoveResult(drawBoard, 7, 7, 2)
  if (drawResult !== "draw") {
    return false
  }

  return true
}
