import Link from 'next/link';
import { Empty } from '@/components/ui';

export default function NotFound() {
  return (
    <div style={{ paddingTop: 24 }}>
      <Empty
        title="Nothing at this address"
        action={
          <Link href="/" className="btn btn-primary sm">
            Back to live
          </Link>
        }
      >
        The job or agent may have been removed, or the link is incomplete.
      </Empty>
    </div>
  );
}
