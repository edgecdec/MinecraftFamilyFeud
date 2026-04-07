# Game Flow Specification

## Session Lifecycle

1. **Host creates game** → server generates a 4-character room code (uppercase letters)
2. **Two teams join** → enter room code + team name on buzzer view
3. **Host starts a round** → picks a question from the bank
4. **Face-off** → one player from each team buzzes in
5. **Rounds play out** → reveal answers, track strikes, steal attempts
6. **Game ends** → host ends game, final scores displayed

## Room Codes
- 4 uppercase letters (e.g., "ABCD")
- Generated server-side, checked for uniqueness among active games
- Expire when host disconnects or ends game

## Face-Off (Start of Each Round)

1. Host selects a question — board shows the question with all answers hidden
2. Host opens the face-off buzzer — exactly one player from each team can buzz
3. First player to buzz gives a verbal answer — host selects/types it
4. If the answer is on the board, it's revealed
5. Second player then gives their answer — host selects/types it
6. If the answer is on the board, it's revealed
7. **Whichever player named the higher-ranked answer wins the face-off**
   - If only one player's answer was on the board, that player wins
   - If neither answer was on the board, the player who buzzed first gets another guess
8. The winning team chooses: **Play** (their team controls the board) or **Pass** (other team controls)

## Playing the Board

1. The controlling team takes turns guessing answers verbally
2. Host enters each guess:
   - If the answer is on the board → reveal it, add its points to the round total
   - If the answer is NOT on the board → **strike** (big X on the board)
3. Continue until:
   - All answers are revealed → controlling team gets all points, round ends
   - 3 strikes → round goes to steal phase

## Strikes
- Wrong answer = 1 strike
- Strikes display as big red X on the board
- 3 strikes = control lost, steal opportunity for the other team

## Stealing

1. After 3 strikes, the opposing team huddles and gives **ONE** answer
2. Host enters the steal attempt:
   - If the answer is on the board → stealing team gets ALL points accumulated in the round (including previously revealed answers)
   - If the answer is NOT on the board → controlling team keeps all the points
3. After steal resolves (success or fail), all remaining unrevealed answers are shown on the board
4. Round ends

## Scoring
- Each answer's point value = number of survey respondents who gave that answer (out of 100 polled)
- Points accumulate per round — all revealed answers contribute to the round total
- The team that wins the round (either by clearing the board, surviving strikes, or stealing) gets the round's total points added to their game score
- Running game totals displayed on the board at all times

## Game State (server-side, in-memory)

```typescript
interface GameState {
  roomCode: string;
  teams: Team[];              // exactly 2 teams
  currentQuestion: Question | null;
  revealedAnswers: number[];  // indices of revealed answers
  strikes: number;
  controllingTeamIndex: number;
  phase: 'lobby' | 'faceoff' | 'faceoff-resolve' | 'playing' | 'steal' | 'roundEnd' | 'gameOver';
  scores: Record<string, number>;  // teamName → total game score
  roundPoints: number;             // points accumulated this round
  faceoff: {
    buzzedTeams: string[];         // team names in buzz order
    answers: { teamName: string; answerIndex: number | null }[];  // face-off guesses
  } | null;
}
```

## Phase Transitions

```
lobby → faceoff (host selects question)
faceoff → faceoff-resolve (both teams have answered or buzzed)
faceoff-resolve → playing (winning team chooses play/pass)
playing → steal (3 strikes)
playing → roundEnd (all answers revealed)
steal → roundEnd (steal attempt resolved)
roundEnd → faceoff (host starts next question)
roundEnd → gameOver (host ends game)
```

## Host Controls Summary
- Select question from bank
- Open face-off buzzer
- Enter face-off answers (select from board or mark as wrong)
- Record play/pass decision
- Enter team guesses during play (select from board or mark as strike)
- Enter steal attempt
- Reveal remaining answers after round
- End round / next question / end game
- Manual score adjustment (in case of mistakes)
