import type { Metadata } from 'next';
import { PostJob } from './PostJob';

export const metadata: Metadata = { title: 'Post a job' };

export default function NewJobPage({ searchParams }: { searchParams: { agent?: string } }) {
  return <PostJob preselectedAgentId={searchParams.agent ?? null} />;
}
