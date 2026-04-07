'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

interface QuestionSummary {
  id: string;
  question: string;
}

interface QuestionSelectorProps {
  onSelect: (questionId: string) => void;
  disabled: boolean;
}

export default function QuestionSelector({ onSelect, disabled }: QuestionSelectorProps) {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data: QuestionSummary[]) => setQuestions(data))
      .catch(() => setQuestions([]));
  }, []);

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
        Select Question
      </Typography>
      <List dense sx={{ maxHeight: 240, overflow: 'auto', mb: 1 }}>
        {questions.map((q) => (
          <ListItemButton
            key={q.id}
            selected={selectedId === q.id}
            onClick={() => setSelectedId(q.id)}
            sx={{ '&.Mui-selected': { bgcolor: 'action.selected' } }}
          >
            <ListItemText primary={q.question} sx={{ '& .MuiListItemText-primary': { fontSize: '0.85rem' } }} />
          </ListItemButton>
        ))}
      </List>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={disabled || !selectedId}
        onClick={() => selectedId && onSelect(selectedId)}
      >
        Start Round
      </Button>
    </Box>
  );
}
