'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameEvent } from '@/hooks/useGameSocket';

type SoundName = 'ding' | 'strike' | 'buzz' | 'applause';

const SOUND_PATHS: Record<SoundName, string> = {
  ding: '/sounds/ding.wav',
  strike: '/sounds/strike.wav',
  buzz: '/sounds/buzz.wav',
  applause: '/sounds/applause.wav',
};

export function useSoundEffects(lastEvent: GameEvent | null, muted: boolean) {
  const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const lastTimestamp = useRef<number>(0);

  /* Preload audio elements once */
  useEffect(() => {
    const cache = audioCache.current;
    for (const [name, path] of Object.entries(SOUND_PATHS)) {
      if (!cache.has(name as SoundName)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        cache.set(name as SoundName, audio);
      }
    }
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return;
      const audio = audioCache.current.get(name);
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {/* autoplay blocked — ignore */});
    },
    [muted]
  );

  /* React to socket events */
  useEffect(() => {
    if (!lastEvent || lastEvent.timestamp === lastTimestamp.current) return;
    lastTimestamp.current = lastEvent.timestamp;

    switch (lastEvent.event) {
      case 'game:answerRevealed':
        play('ding');
        break;
      case 'game:strike':
        play('strike');
        break;
      case 'game:roundEnd':
        play('applause');
        break;
      case 'game:buzzed':
        play('buzz');
        break;
    }
  }, [lastEvent, play]);
}
