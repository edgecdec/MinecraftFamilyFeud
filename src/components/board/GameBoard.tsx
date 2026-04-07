'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { MAX_STRIKES } from '@/lib/constants';
import type { GameState } from '@/types';
import AnswerTile from './AnswerTile';

interface GameBoardProps {
  gameState: GameState;
}

export default function GameBoard({ gameState }: GameBoardProps) {
  const { currentQuestion, revealedAnswers, teams, scores, strikes, phase } = gameState;
  const answers = currentQuestion?.answers ?? [];

  const midpoint = Math.ceil(answers.length / 2);
  const leftColumn = answers.slice(0, midpoint);
  const rightColumn = answers.slice(midpoint);

  const showBoard = phase !== 'lobby' && phase !== 'gameOver';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
      }}
    >
      {/* Question */}
      <Box sx={{ textAlign: 'center', mb: 3, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'lobby' && (
          <Typography variant="h4" sx={{ color: 'primary.main' }}>
            MINECRAFT FAMILY FEUD
          </Typography>
        )}
        {phase === 'gameOver' && (
          <Typography variant="h4" sx={{ color: 'primary.main' }}>
            GAME OVER
          </Typography>
        )}
        {showBoard && currentQuestion && (
          <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
            {currentQuestion.question}
          </Typography>
        )}
      </Box>

      {/* Answer Grid */}
      {showBoard && (
        <Box sx={{ display: 'flex', gap: 2, flex: 1, mb: 3 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {leftColumn.map((a, i) => (
              <AnswerTile key={i} index={i} text={a.text} count={a.count} revealed={revealedAnswers.includes(i)} />
            ))}
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {rightColumn.map((a, i) => (
              <AnswerTile key={midpoint + i} index={midpoint + i} text={a.text} count={a.count} revealed={revealedAnswers.includes(midpoint + i)} />
            ))}
          </Box>
        </Box>
      )}

      {/* Strikes */}
      {showBoard && strikes > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          {Array.from({ length: MAX_STRIKES }).map((_, i) => (
            <Typography key={i} variant="h3" sx={{ color: i < strikes ? 'error.main' : 'transparent', fontSize: '2.5rem' }}>
              ✕
            </Typography>
          ))}
        </Box>
      )}

      {/* Scores */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
        {teams.map((team) => (
          <Box key={team.name} sx={{ textAlign: 'center', bgcolor: 'background.paper', border: '3px solid', borderColor: 'divider', px: 4, py: 2 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.7rem', mb: 1 }}>
              {team.name}
            </Typography>
            <Typography variant="h4" sx={{ color: 'primary.main', fontSize: '1.5rem' }}>
              {scores[team.name] ?? 0}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
