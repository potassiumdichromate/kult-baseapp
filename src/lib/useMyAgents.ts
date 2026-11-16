'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { MyAgent } from './types';

export function useMyAgents(enabled: boolean) {
  return useQuery({
    queryKey: ['me', 'agents'],
    queryFn: () => api<{ agents: MyAgent[] }>('/api/me/agents').then((r) => r.agents),
    enabled,
  });
}
