# Game Flow Specification

## Session Lifecycle

1. **Host creates game** → server generates a 4-character room code (uppercase letters)
2. **Teams join** → enter room code + team name on buzzer view
3. **Host selects question** → picks from loaded question bank
4. **Round plays** → buzzer → answer → reveal → score → strikes
5. **Host advances** → next question or end game
6. **Game ends** → final scores displayed

## Room Codes
- 4 uppercase letters (e.g., "ABCD")
- Generated server-side, checked for uniqueness among active games
- Expire when host disconnects or ends game

## Round Flow

1. Host selects a question from the bank
2. Board shows the question text with all answers hidden (blue tiles)
3. Host opens buzzer — teams can buzz in
4. First team to buzz gets control
5. Team gives an answer verbally — host types/selects it
6. If answer is on the board: reveal it, add points to controlling team
7. If answer is NOT on the board: strike (X animation)
8. 3 strikes: control passes to other team for a steal attempt
9. Steal: other team gets one guess. If correct, they get ALL revealed points. If wrong, controlling team keeps points.
10. Round ends when all answers revealed OR steal resolved
11. Host can manually end a round at any time

## Scoring
- Each answer's point value = number of survey respondents who gave that answer
- Points accumulate per round for the controlling team
- On a successful steal, stealing team gets all points from that round
- Running total displayed on board

## Game State (server-side, in-memory)

```typescript
interface GameState {
  roomCode: string;
  teams: Team[];
  currentQuestion: Question | null;
  revealedAnswers: number[];  // indices of revealed answers
  strikes: number;
  controllingTeamIndex: number;
  phase: 'lobby' | 'question' | 'buzzer' | 'playing' | 'steal' | 'roundEnd' | 'gameOver';
  scores: Record<string, number>;  // teamName → total score
  roundPoints: number;  // points accumulated this round
  buzzOrder: string[];  // team names in order they buzzed
}
```

## Final Round (Optional)
- Fast money style: one player, 5 questions, 20 seconds each
- Host controls timer and answer acceptance
- Can be skipped — not every game needs it
