# Code Style and Organization

## File Size and Splitting
- No file should exceed ~150 lines. If it does, extract logic into separate files.
- One component per file. One hook per file. One utility concern per file.

## Helper Functions and Shared Logic
- Before writing any logic, search the codebase for existing implementations. Reuse before creating.
- Extract repeated patterns into shared helpers in `src/lib/`:
  - `src/lib/game.ts` — game state management, scoring logic
  - `src/lib/questions.ts` — question loading and validation
  - `src/lib/constants.ts` — all game constants (max teams, max rounds, etc.)
  - `src/lib/theme.ts` — MUI Minecraft theme configuration
- If you write the same pattern in two places, extract it immediately.

## Component Organization
- `src/components/common/` — reusable UI (ThemeRegistry, MinecraftButton, etc.)
- `src/components/board/` — game board display components
- `src/components/host/` — host control panel components
- `src/components/buzzer/` — player buzzer components
- Components should accept props, not fetch their own data.

## Hooks
- Custom hooks go in `src/hooks/`.
- Each hook in its own file: `useGameSocket.ts`, `useGameState.ts`, etc.
- One concern per hook.

## Types
- All shared TypeScript interfaces and types go in `src/types/`.
- `src/types/socket.ts` — Socket.io event types
- `src/types/game.ts` — game state, question, answer types
- Never use `any`. Define proper types.

## Naming Conventions
- Files: camelCase for utilities (`questions.ts`), PascalCase for components (`GameBoard.tsx`).
- Functions: camelCase (`revealAnswer`, `calculateScore`).
- Types/Interfaces: PascalCase (`GameState`, `QuestionRound`).
- Constants: UPPER_SNAKE_CASE (`MAX_STRIKES`, `MAX_TEAMS`).

## Imports
- Use the `@/` path alias for all internal imports.
- Group imports: external packages first, then internal modules, then types.
- Use top-level ES imports only. Never dynamic `require()` inside functions.
