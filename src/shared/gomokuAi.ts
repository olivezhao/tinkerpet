import {
  GOMOKU_BOARD_SIZE,
  type GomokuDifficulty,
  type GomokuGameState,
  type GomokuSide
} from "./gameTypes"
import { applyGomokuMove, evaluateMoveResult } from "./gomokuEngine"

interface MoveScore {
  score: number
  x: number
  y: number
}

function isEmpty(board: GomokuGameState["board"], x: number, y: number): boolean {
  return board[y]?.[x] === 0
}

function collectCandidates(state: GomokuGameState): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  const hasMoves = state.moveCount > 0

  if (!hasMoves) {
    const c = Math.floor(GOMOKU_BOARD_SIZE / 2)
    return [{ x: c, y: c }]
  }

  for (let y = 0; y < GOMOKU_BOARD_SIZE; y += 1) {
    for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
      if (!isEmpty(state.board, x, y)) {
        continue
      }

      let nearStone = false
      for (let dy = -2; dy <= 2 && !nearStone; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= GOMOKU_BOARD_SIZE || ny < 0 || ny >= GOMOKU_BOARD_SIZE) {
            continue
          }
          if (state.board[ny][nx] !== 0) {
            nearStone = true
            break
          }
        }
      }

      if (nearStone) {
        out.push({ x, y })
      }
    }
  }

  return out
}

function localLinePotential(
  board: GomokuGameState["board"],
  x: number,
  y: number,
  side: GomokuSide
): number {
  const dirs: Array<[number, number]> = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1]
  ]

  let total = 0
  for (const [dx, dy] of dirs) {
    let count = 1
    let openEnds = 0
    let nx = x + dx
    let ny = y + dy
    while (
      nx >= 0 &&
      nx < GOMOKU_BOARD_SIZE &&
      ny >= 0 &&
      ny < GOMOKU_BOARD_SIZE &&
      board[ny][nx] === side
    ) {
      count += 1
      nx += dx
      ny += dy
    }
    if (
      nx >= 0 &&
      nx < GOMOKU_BOARD_SIZE &&
      ny >= 0 &&
      ny < GOMOKU_BOARD_SIZE &&
      board[ny][nx] === 0
    ) {
      openEnds += 1
    }

    nx = x - dx
    ny = y - dy
    while (
      nx >= 0 &&
      nx < GOMOKU_BOARD_SIZE &&
      ny >= 0 &&
      ny < GOMOKU_BOARD_SIZE &&
      board[ny][nx] === side
    ) {
      count += 1
      nx -= dx
      ny -= dy
    }
    if (
      nx >= 0 &&
      nx < GOMOKU_BOARD_SIZE &&
      ny >= 0 &&
      ny < GOMOKU_BOARD_SIZE &&
      board[ny][nx] === 0
    ) {
      openEnds += 1
    }

    if (count >= 5) {
      total += 20000
    } else if (count === 4 && openEnds === 2) {
      total += 5000
    } else if (count === 4) {
      total += 1800
    } else if (count === 3 && openEnds === 2) {
      total += 900
    } else if (count === 3) {
      total += 260
    } else if (count === 2 && openEnds === 2) {
      total += 60
    }
  }

  return total
}

function scoreMove(state: GomokuGameState, x: number, y: number, side: GomokuSide): number {
  const next = applyGomokuMove(state, x, y, side)
  if (next.result === "tinker_win" || next.result === "player_win") {
    return 30000
  }

  const selfScore = localLinePotential(next.board, x, y, side)
  const enemy = side === 1 ? 2 : 1
  const blockScore = localLinePotential(next.board, x, y, enemy)
  return selfScore + blockScore * 0.72
}

function chooseEasyMove(state: GomokuGameState): { x: number; y: number } {
  const candidates = collectCandidates(state)
  if (candidates.length === 0) {
    return { x: 7, y: 7 }
  }

  // simple defense: block immediate win
  for (const c of candidates) {
    const boardCopy = state.board.map((row) => [...row])
    boardCopy[c.y][c.x] = 1
    if (evaluateMoveResult(boardCopy, c.x, c.y, 1) === "player_win") {
      return c
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}

function chooseNormalMove(state: GomokuGameState): { x: number; y: number } {
  const side = 2
  const candidates = collectCandidates(state)
  const scored: MoveScore[] = candidates.map((c) => ({
    score: scoreMove(state, c.x, c.y, side),
    x: c.x,
    y: c.y
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored[0] ?? { x: 7, y: 7 }
}

function chooseHardMove(state: GomokuGameState): { x: number; y: number } {
  const start = Date.now()
  const aiSide: GomokuSide = 2
  const playerSide: GomokuSide = 1
  const candidates = collectCandidates(state)
    .map((c) => ({
      score: scoreMove(state, c.x, c.y, aiSide),
      x: c.x,
      y: c.y
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  let best: MoveScore | null = null
  for (const c of candidates) {
    if (Date.now() - start > 80) {
      break
    }

    const aiState = applyGomokuMove(state, c.x, c.y, aiSide)
    if (aiState.result === "tinker_win") {
      return { x: c.x, y: c.y }
    }

    const playerReplies = collectCandidates(aiState)
      .map((m) => ({
        score: scoreMove(aiState, m.x, m.y, playerSide),
        x: m.x,
        y: m.y
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    const worstReply = playerReplies[0]?.score ?? 0
    const finalScore = c.score - worstReply * 0.78

    if (!best || finalScore > best.score) {
      best = { score: finalScore, x: c.x, y: c.y }
    }
  }

  if (!best) {
    return chooseNormalMove(state)
  }
  return { x: best.x, y: best.y }
}

export function chooseTinkerMove(
  state: GomokuGameState,
  difficulty: GomokuDifficulty
): { x: number; y: number } {
  if (difficulty === "easy") {
    return chooseEasyMove(state)
  }
  if (difficulty === "hard") {
    return chooseHardMove(state)
  }
  return chooseNormalMove(state)
}
