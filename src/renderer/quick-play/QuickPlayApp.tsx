import React from "react"
import type {
  GomokuDifficulty,
  GomokuGameState,
  GomokuHistoryItem
} from "../../shared/gameTypes"
import { GOMOKU_BOARD_SIZE } from "../../shared/gameTypes"

const DIFFICULTY_LABEL: Record<GomokuDifficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard"
}

const EMPTY_HISTORY: GomokuHistoryItem[] = []

function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000)
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}

function formatResult(result: GomokuHistoryItem["result"]): string {
  if (result === "win") return "Win"
  if (result === "lose") return "Lose"
  return "Draw"
}

function resultText(state: GomokuGameState | null): string {
  if (!state) {
    return "Create a game to start."
  }
  if (state.result === "player_win") {
    return "You win."
  }
  if (state.result === "tinker_win") {
    return "Tinker wins."
  }
  if (state.result === "draw") {
    return "Draw."
  }
  return state.currentTurn === 1 ? "Your turn." : "Tinker is thinking..."
}

export function QuickPlayApp(): React.ReactElement {
  const [difficulty, setDifficulty] = React.useState<GomokuDifficulty>("normal")
  const [game, setGame] = React.useState<GomokuGameState | null>(null)
  const [history, setHistory] = React.useState<GomokuHistoryItem[]>(EMPTY_HISTORY)
  const [isBusy, setIsBusy] = React.useState(false)
  const [feedback, setFeedback] = React.useState("")

  const refreshHistory = React.useCallback(async () => {
    const items = await window.tinkerpetGame.getHistory()
    setHistory(items)
  }, [])

  React.useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  const startGame = React.useCallback(
    async (nextDifficulty: GomokuDifficulty) => {
      setIsBusy(true)
      setFeedback("")
      try {
        await window.tinkerpetGame.setDifficulty(nextDifficulty)
        const nextGame = await window.tinkerpetGame.createNewGame(nextDifficulty)
        setGame(nextGame)
      } finally {
        setIsBusy(false)
      }
    },
    []
  )

  React.useEffect(() => {
    void startGame(difficulty)
  }, [difficulty, startGame])

  const finishIfNeeded = React.useCallback(
    async (nextState: GomokuGameState) => {
      if (nextState.result === "ongoing") {
        return
      }
      const finishResult = await window.tinkerpetGame.finishGame({
        difficulty: nextState.difficulty,
        gameState: nextState
      })
      if (finishResult.ok) {
        setFeedback(`${finishResult.message} +${finishResult.xpDelta} XP`)
      }
      await refreshHistory()
    },
    [refreshHistory]
  )

  const handleCellClick = React.useCallback(
    async (x: number, y: number) => {
      if (!game || isBusy || game.result !== "ongoing" || game.currentTurn !== 1) {
        return
      }

      setIsBusy(true)
      setFeedback("")
      try {
        const playerMoved = await window.tinkerpetGame.makeMove(game, x, y)
        setGame(playerMoved)
        await finishIfNeeded(playerMoved)
        if (playerMoved.result !== "ongoing") {
          return
        }

        const aiMoved = await window.tinkerpetGame.requestAiMove(playerMoved)
        setGame(aiMoved)
        await finishIfNeeded(aiMoved)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Move failed.")
      } finally {
        setIsBusy(false)
      }
    },
    [finishIfNeeded, game, isBusy]
  )

  return (
    <main className="quick-play-shell">
      <header className="quick-play-header">
        <div>
          <p className="quick-play-eyebrow">TinkerPet V0.5</p>
          <h1>Quick Play</h1>
        </div>
        <div className="quick-play-actions">
          <select
            aria-label="Difficulty"
            onChange={(event) => setDifficulty(event.target.value as GomokuDifficulty)}
            value={difficulty}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
          <button disabled={isBusy} onClick={() => void startGame(difficulty)} type="button">
            Restart
          </button>
        </div>
      </header>

      <section className="quick-play-board-panel">
        <p className="quick-play-status">{resultText(game)}</p>
        <div className="gomoku-board" role="grid" aria-label="Gomoku Board">
          {Array.from({ length: GOMOKU_BOARD_SIZE * GOMOKU_BOARD_SIZE }, (_, index) => {
            const x = index % GOMOKU_BOARD_SIZE
            const y = Math.floor(index / GOMOKU_BOARD_SIZE)
            const stone = game?.board[y]?.[x] ?? 0
            return (
              <button
                aria-label={`Cell ${x + 1},${y + 1}`}
                className="gomoku-cell"
                disabled={isBusy || stone !== 0 || game?.result !== "ongoing"}
                key={`${x}-${y}`}
                onClick={() => void handleCellClick(x, y)}
                type="button"
              >
                {stone === 0 ? null : (
                  <span className={stone === 1 ? "stone player" : "stone tinker"} />
                )}
              </button>
            )
          })}
        </div>
        {feedback ? <p className="quick-play-feedback">{feedback}</p> : null}
      </section>

      <section className="quick-play-history">
        <h2>Recent Games</h2>
        {history.length === 0 ? (
          <p className="muted">No games yet.</p>
        ) : (
          <ul>
            {history.map((item) => (
              <li key={`${item.id}-${item.endedAt}`}>
                <span>{formatResult(item.result)}</span>
                <span>{DIFFICULTY_LABEL[item.difficulty]}</span>
                <span>{formatDuration(item.durationMs)}</span>
                <span>{item.totalMoves} moves</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
