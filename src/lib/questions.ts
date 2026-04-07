import type { Question } from '@/types/game';
import questionsData from '../../data/questions.json';

export const questions: Question[] = questionsData.questions;

export function getQuestionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}
