'use client';

import { Suspense } from 'react';
import HostPanel from '@/components/host/HostPanel';

export default function HostPage() {
  return (
    <Suspense>
      <HostPanel />
    </Suspense>
  );
}
