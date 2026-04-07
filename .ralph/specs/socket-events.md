# Socket Events Specification

All events must have TypeScript interfaces in `src/types/socket.ts`.

## Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `host:create` | `{ hostPin: string }` | Host creates a new game session |
| `host:selectQuestion` | `{ questionId: string }` | Host picks a question, starts face-off |
| `host:openFaceoff` | `{}` | Host enables face-off buzzer |
| `host:faceoffAnswer` | `{ teamName: string, answerIndex: number \| null }` | Host enters a face-off guess (null = not on board) |
| `host:playOrPass` | `{ choice: 'play' \| 'pass' }` | Winning face-off team's decision |
| `host:correctAnswer` | `{ answerIndex: number }` | Host reveals a correct answer during play |
| `host:strike` | `{}` | Host marks a wrong answer |
| `host:stealAttempt` | `{ answerIndex: number \| null }` | Host enters steal guess (null = wrong) |
| `host:revealRemaining` | `{}` | Show all unrevealed answers after round |
| `host:endRound` | `{}` | End current round, award points |
| `host:adjustScore` | `{ teamName: string, delta: number }` | Manual score adjustment |
| `host:endGame` | `{}` | End the game |
| `team:join` | `{ roomCode: string, teamName: string }` | Team joins a game |
| `team:buzz` | `{}` | Team buzzes in during face-off |

## Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `game:created` | `{ roomCode: string }` | Game session created |
| `game:state` | `GameState` | Full game state update (sent after every state change) |
| `game:teamJoined` | `{ teamName: string, teams: Team[] }` | A team joined |
| `game:faceoffOpen` | `{}` | Face-off buzzer is now active |
| `game:buzzed` | `{ teamName: string }` | A team buzzed in |
| `game:faceoffResult` | `{ winnerTeam: string }` | Face-off winner announced |
| `game:answerRevealed` | `{ answerIndex: number, answer: Answer }` | Answer flipped on board |
| `game:strike` | `{ strikes: number }` | Strike added |
| `game:stealStart` | `{ teamName: string }` | Steal phase begins for this team |
| `game:stealResult` | `{ success: boolean, teamName: string }` | Steal outcome |
| `game:roundEnd` | `{ winnerTeam: string, roundPoints: number, scores: Record<string, number> }` | Round complete |
| `game:allRevealed` | `{ answers: Answer[] }` | All remaining answers shown |
| `game:over` | `{ finalScores: Record<string, number>, winner: string }` | Game finished |
| `error` | `{ message: string }` | Error message |

## Room Management
- Host socket joins room `game:{roomCode}` (receives all events)
- Team sockets join room `game:{roomCode}` (receive all events)
- Board socket joins room `game:{roomCode}` (receive all events, display only)
- All game events broadcast to `game:{roomCode}`

## State Sync Strategy
- `game:state` is sent after every mutation as the source of truth
- Granular events (`game:strike`, `game:answerRevealed`, etc.) are sent alongside for triggering animations
- Clients should use `game:state` for rendering and granular events for animation triggers only
