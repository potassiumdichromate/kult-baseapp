'use client';

import { Empty } from '@/components/ui';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ paddingTop: 24 }}>
      <Empty
        title="This screen did not load"
        action={
          <button type="button" className="btn btn-primary sm" onClick={reset}>
            Try again
          </button>
        }
      >
        The Kult API did not answer in time. Nothing was changed.
      </Empty>
    </div>
  );
}
