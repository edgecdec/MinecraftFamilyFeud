# Anti-Patterns — Read This First Every Loop

These are mistakes Ralph has made on previous projects. Do not repeat them.

## Iteration Discipline
- STRICTLY ONE task per iteration. NEVER combine multiple changes into one commit.
- If you notice another issue while working, log it in .ralph/progress.txt and move on. Do NOT fix it.
- Each commit = exactly ONE logical change. "Fix X and Y" is WRONG. "Fix X" is correct.
- If a task is bigger than expected, implement what you can, set it to "done", and create a note in progress.txt about remaining work. Do NOT leave it "in_progress" forever — this causes infinite loops.

## Concurrent Editing
- A human developer may be editing files at the same time as you. ALWAYS re-read a file before modifying it — never assume it hasn't changed since you last read it.
- Before editing prd.json or progress.txt, read the current version first. Another process may have updated it.
- Use `git pull` or check `git status` before committing if you suspect concurrent changes.

## Context Management
- Do NOT read every file in the project — only read files relevant to the current task.
- Read the relevant spec file ONCE, then work from memory.
- Do NOT explore the entire directory tree. Only look at what you need.
- Minimize context window usage — you degrade when the window fills up.

## Build & Validation
- NEVER commit code that doesn't pass ALL backpressure commands (tsc --noEmit, npm run build).
- When changing imports or moving files, verify build passes — macOS is case-insensitive but the Linux server is case-sensitive.

## Code Quality
- NEVER use dynamic `require()` inside route handlers — use top-level ES imports.
- NEVER use `any` type — define proper types in src/types/.
- FULL implementations only. No placeholders. No stubs. No TODOs.
- Search the codebase before implementing — don't assume something doesn't exist.
- NEVER put magic numbers or hardcoded strings inline — use named constants.
- NEVER duplicate logic — search for existing utilities/hooks/components first.

## MUI / Theming
- NEVER use hardcoded hex colors in components.
- ALWAYS use MUI theme tokens: `text.primary`, `text.secondary`, `background.default`, `background.paper`, `divider`, `primary.main`, `action.hover`.
- The Minecraft theme is defined in the theme file — reference it, don't override it inline.

## React Patterns
- Props that seed useState only run once — if the prop changes, state won't update. Use useEffect to sync.
- NEVER create new object/array references inside useEffect dependencies — use useMemo/useCallback.
- NEVER call setState inside useEffect without proper dependency guards — causes infinite re-renders.

## Socket.io
- Socket.io event names are strings — typos cause silent failures. Always reference the types in src/types/socket.ts.
- No auth on sockets for this project — but always validate room codes before processing events.
- When broadcasting to a room, use `socket.to(room)` (excludes sender) vs `io.to(room)` (includes sender). Pick the right one.

## Deployment
- NEVER modify deploy_webhook.sh or server.js webhook handler unless the task specifically requires it.
- NEVER run `node server.js` locally as a background process — it gets stuck and blocks the iteration.
- This app deploys to a REMOTE server. After pushing, the webhook auto-deploys.
- After every `git push`, wait 60 seconds then verify deployment: `source .ralph/.server-env && ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:3004"` — must return 200.
- Do NOT proceed to the next task if the site is down after your push. Fix it first.

## Security — Secrets and Sensitive Data
- NEVER hardcode IP addresses, API keys, secrets, tokens, or passwords in any committed file.
- ALL secrets go in `.env` (gitignored). Reference them via `process.env.VARIABLE_NAME`.
- Server connection details live in `.ralph/.server-env` (gitignored). Never copy them into other files.
- NEVER commit `.env` files. Verify `.gitignore` includes `.env` before every commit that touches env vars.

## File Handling
- ALWAYS read prd.json before editing it — parse the JSON, modify the specific task, write it back. Do NOT rewrite the entire file from memory.
- When appending to progress.txt, APPEND only — do not rewrite existing content.
- Do NOT modify spec files unless explicitly told to by the human.

## Project Initialization
- NEVER use `create-next-app` or `npx create-*` — these commands hang in non-interactive mode when the directory isn't empty.
- Instead, manually create package.json, tsconfig.json, next.config.js, then run `npm install`.

## Git Hygiene
- NEVER use `git push --force` or `git push --force-with-lease` EXCEPT for the final status update amend after deploy verification passes.
- The ONLY allowed amend is: deploy verified → update prd.json/progress.txt → `git commit --amend --no-edit && git push --force-with-lease`. This keeps one clean commit per task.

## Nova Act Testing
After deploying any UI task, write a temporary Nova Act test script to verify the feature works in a real browser against the LIVE site. Follow this pattern:

### Script Pattern
- Save as `/tmp/test_<feature>.py`
- Run with: `/opt/homebrew/bin/python3.13 /tmp/test_<feature>.py`
- Use `headless=True` in NovaAct constructor
- ONE NovaAct session — do NOT create multiple sessions
- Use `nova.act("short one-sentence instruction")` for browser actions
- Use `nova.page` (Playwright) for assertions
- `act()` returns `ActResult` with only `metadata` — NO `.response` attribute. Use `act_get()` with a schema for structured data extraction.
- Print PASS/FAIL for each check
- Delete the temp script after verification passes
- Max 5 steps per `act()` call: `nova.act("...", max_steps=5)`
- No auth needed for this app — just navigate directly to the page
