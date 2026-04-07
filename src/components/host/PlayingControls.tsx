'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ClientToServerEvents, GameState } from '@/types';

const NOT_ON_BOARD = -1;
const SCORE_STEP = 10;

interface PlayingControlsProps {
  gameState: GameState;
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => void;
}

export default function PlayingControls({ gameState, emit }: PlayingControlsProps) {
  const { phase, currentQuestion, revealedAnswers, strikes, controllingTeamIndex, teams, scores, roundPoints } = gameState;

  const controllingTeam = teams[controllingTeamIndex]?.name ?? '';
  const stealingTeamIndex = controllingTeamIndex === 0 ? 1 : 0;
  const stealingTeam = teams[stealingTeamIndex]?.name ?? '';

  if (phase === 'playing') {
    return (
      <Stack spacing={2}>
        <PhaseHeader label="Playing" detail={`${controllingTeam} controls · ${roundPoints} pts`} />
        <StrikeSection strikes={strikes} onStrike={() => emit('host:strike', {})} />
        <AnswerButtons
          question={currentQuestion}
          revealedAnswers={revealedAnswers}
          onReveal={(i) => emit('host:correctAnswer', { answerIndex: i })}
        />
        <ScoreAdjust teams={teams} scores={scores} emit={emit} />
      </Stack>
    );
  }

  if (phase === 'steal') {
    return (
      <Stack spacing={2}>
        <PhaseHeader label="Steal" detail={`${stealingTeam} is stealing · ${roundPoints} pts at stake`} />
        <StealSelect
          question={currentQuestion}
          revealedAnswers={revealedAnswers}
          emit={emit}
        />
        <ScoreAdjust teams={teams} scores={scores} emit={emit} />
      </Stack>
    );
  }

  if (phase === 'roundEnd') {
    return (
      <Stack spacing={2}>
        <PhaseHeader label="Round Over" detail={`${roundPoints} pts awarded`} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="secondary" fullWidth onClick={() => emit('host:revealRemaining', {})}>
            Reveal Remaining
          </Button>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="primary" fullWidth onClick={() => emit('host:endRound', {})}>
            Next Question
          </Button>
          <Button variant="outlined" color="error" fullWidth onClick={() => emit('host:endGame', {})}>
            End Game
          </Button>
        </Stack>
        <ScoreAdjust teams={teams} scores={scores} emit={emit} />
      </Stack>
    );
  }

  return null;
}

function PhaseHeader({ label, detail }: { label: string; detail: string }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ color: 'text.primary' }}>{label}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{detail}</Typography>
    </Box>
  );
}

function StrikeSection({ strikes, onStrike }: { strikes: number; onStrike: () => void }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ color: 'error.main', fontWeight: 'bold' }}>
          {'✕ '.repeat(strikes)}{'○ '.repeat(3 - strikes)}
          <Box component="span" sx={{ color: 'text.secondary', ml: 1, fontSize: '0.75rem' }}>
            {strikes}/3 strikes
          </Box>
        </Typography>
        <Button variant="contained" color="error" size="small" onClick={onStrike} disabled={strikes >= 3}>
          Strike ✕
        </Button>
      </Stack>
    </Box>
  );
}

function AnswerButtons({
  question,
  revealedAnswers,
  onReveal,
}: {
  question: GameState['currentQuestion'];
  revealedAnswers: number[];
  onReveal: (index: number) => void;
}) {
  if (!question) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>Reveal Answer</Typography>
      <Stack spacing={1}>
        {question.answers.map((a, i) => {
          const revealed = revealedAnswers.includes(i);
          return (
            <Button
              key={i}
              variant={revealed ? 'outlined' : 'contained'}
              color="primary"
              disabled={revealed}
              fullWidth
              onClick={() => onReveal(i)}
              sx={{ justifyContent: 'space-between', textTransform: 'none' }}
            >
              <span>{i + 1}. {a.text}</span>
              <span>{a.count} pts</span>
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}

function StealSelect({
  question,
  revealedAnswers,
  emit,
}: {
  question: GameState['currentQuestion'];
  revealedAnswers: number[];
  emit: PlayingControlsProps['emit'];
}) {
  const [selected, setSelected] = useState<number>(NOT_ON_BOARD);

  const handleSubmit = () => {
    emit('host:stealAttempt', { answerIndex: selected === NOT_ON_BOARD ? null : selected });
  };

  if (!question) return null;

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>Steal Answer</Typography>
      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          value={selected}
          onChange={(e) => setSelected(e.target.value as number)}
          sx={{ flex: 1, fontSize: '0.85rem' }}
        >
          <MenuItem value={NOT_ON_BOARD}>Wrong</MenuItem>
          {question.answers.map((a, i) => (
            <MenuItem key={i} value={i} disabled={revealedAnswers.includes(i)}>
              {i + 1}. {a.text}
            </MenuItem>
          ))}
        </Select>
        <Button variant="contained" size="small" onClick={handleSubmit}>
          Submit
        </Button>
      </Stack>
    </Box>
  );
}

function ScoreAdjust({
  teams,
  scores,
  emit,
}: {
  teams: GameState['teams'];
  scores: GameState['scores'];
  emit: PlayingControlsProps['emit'];
}) {
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>Score Adjust</Typography>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
        {teams.map((t) => (
          <Stack key={t.name} sx={{ alignItems: 'center' }} spacing={0.5}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{t.name}</Typography>
            <Typography variant="h5" sx={{ color: 'primary.main' }}>{scores[t.name] ?? 0}</Typography>
            <Stack direction="row" spacing={0.5}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 36 }}
                onClick={() => emit('host:adjustScore', { teamName: t.name, delta: -SCORE_STEP })}
              >
                −
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 36 }}
                onClick={() => emit('host:adjustScore', { teamName: t.name, delta: SCORE_STEP })}
              >
                +
              </Button>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
