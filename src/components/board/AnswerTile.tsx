'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface AnswerTileProps {
  index: number;
  text?: string;
  count?: number;
  revealed: boolean;
}

export default function AnswerTile({ index, text, count, revealed }: AnswerTileProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 64,
        border: '3px solid',
        borderColor: revealed ? 'secondary.main' : '#555',
        bgcolor: revealed ? 'secondary.main' : 'background.paper',
        px: 2,
        gap: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: revealed ? '#FFF' : 'text.secondary',
          minWidth: 36,
          textAlign: 'center',
          fontSize: '0.85rem',
        }}
      >
        {index + 1}
      </Typography>
      {revealed ? (
        <>
          <Typography
            sx={{
              flex: 1,
              color: '#FFF',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '0.75rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'primary.main', fontSize: '0.85rem', minWidth: 40, textAlign: 'right' }}
          >
            {count}
          </Typography>
        </>
      ) : (
        <Typography
          sx={{
            flex: 1,
            color: 'text.secondary',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.7rem',
            letterSpacing: 4,
          }}
        >
          ■■■■■■
        </Typography>
      )}
    </Box>
  );
}
