# Socket Events Specification

All events must have TypeScript interfaces in `src/types/socket.ts`.

## Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `host:create` | `{ hostPin: string }` | Host creates a new game session |
| `host:selectQuestion` | `{ questionId: string }` | Host picks a question for the round |
| `host:openBuzzer` | `{}` | Host enables buzzing |
| `host:revealAnswer` | `{ answerIndex: number }` | Host reveals a specific answer |
| `host:strike` | `{}` | Host marks a wrong answer (strike) |
| `host:awardPoints` | `{ teamName: string, points: number }` | Manual point adjustment |
| `host:startSteal` | `{}` | Initiate steal for other team |
| `host:endRound` | `{}` | End current round |
| `host:endGame` | `{}` | End the game |
| `team:join` | `{ roomCode: string, teamName: string }` | Team joins a game |
| `team:buzz` | `{}` | Team buzzes in |

## Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `game:created` | `{ roomCode: string }` | Game session created |
| `game:state` | `GameState` | Full game state update |
| `game:teamJoined` | `{ teamName: string, teams: Team[] }` | A team joined |
| `game:buzzerOpen` | `{}` | Buzzer is now active |
| `game:buzzed` | `{ teamName: string, order: number }` | A team buzzed in |
| `game:answerRevealed` | `{ answerIndex: number, answer: Answer, points: number }` | Answer flipped |
| `game:strike` | `{ strikes: number }` | Strike added |
| `game:stealStart` | `{ teamName: string }` | Steal phase begins |
| `game:roundEnd` | `{ scores: Record<string, number> }` | Round complete |
| `game:over` | `{ finalScores: Record<string, number>, winner: string }` | Game finished |
| `error` | `{ message: string }` | Error message |

## Room Management
- Host socket joins room `host:{roomCode}`
- Team sockets join room `team:{roomCode}`
- Board socket joins room `board:{roomCode}`
- All game events broadcast to the room code room (all participants)
