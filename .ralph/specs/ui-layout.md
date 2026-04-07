# UI Layout Specification

## Landing Page (`/`)
- Minecraft-style title: "MINECRAFT FAMILY FEUD"
- Two big buttons: "Host a Game" and "Join a Game"
- "Join a Game" shows input for room code + team name
- Minecraft dirt/grass background aesthetic
- Mobile-friendly

## Board View (`/board?room=XXXX`)
- Full-screen, designed for projection
- Classic Family Feud board layout:
  - Question text at top
  - Answer tiles in two columns (up to 8 answers)
  - Hidden answers show as blue/stone tiles with number
  - Revealed answers flip to show text + point value
- Team scores at bottom left and right
- Strike indicators (big red X animations)
- Minecraft block styling for tiles (stone texture for hidden, gold for revealed)
- No interactive elements — display only

## Host View (`/host?room=XXXX`)
- Desktop-optimized control panel
- Sections:
  - Game info: room code (large, shareable), connected teams
  - Question selector: dropdown/list of available questions
  - Answer controls: buttons to reveal each answer
  - Strike button
  - Score display with manual adjustment
  - Round controls: start steal, end round, next question, end game
- Compact layout — host needs to see everything at once

## Buzzer View (`/buzzer?room=XXXX&team=NAME`)
- Mobile-first, full-screen
- Giant buzz button (fills most of the screen)
- Team name displayed at top
- Visual feedback: button changes color when buzzed
- Shows "WAIT" when buzzer is locked, "BUZZ!" when active
- Vibration feedback on mobile when buzzer opens (if supported)

## Minecraft Theme Elements
- "Press Start 2P" pixel font for headings and game text
- Block-style borders (2-3px solid, squared corners)
- Color palette from AGENTS.md theme section
- Subtle dirt/grass texture backgrounds (CSS patterns, not images)
- Answer reveal animation: tile flip with Minecraft-style sound effect (optional)
