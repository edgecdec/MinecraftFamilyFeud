import { NextResponse } from 'next/server';
import questionsData from '../../../../data/questions.json';

export async function GET() {
  const summaries = questionsData.questions.map((q) => ({
    id: q.id,
    question: q.question,
  }));
  return NextResponse.json(summaries);
}
