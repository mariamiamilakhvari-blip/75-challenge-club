import { AlertCircle } from 'lucide-react';

import { getPreset } from '@/shared/utils/challenge-rules';

type ChallengeFixNoticeProps = {
  // required challenge keys the saved profile was missing
  missing: string[];
};

export const ChallengeFixNotice = ({ missing }: ChallengeFixNoticeProps) => {
  const titles = missing.map((key) => getPreset(key)?.title ?? key);

  return (
    <div role="status" className="flex gap-3 rounded-2xl border border-primary bg-primary/10 p-4 text-sm">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="space-y-1 text-foreground">
        <p className="font-semibold">Your challenges need an update</p>
        {titles.length > 0 && <p>Added required: {titles.join(', ')}.</p>}
        <p className="text-muted-foreground">Check the days on each card, then save.</p>
      </div>
    </div>
  );
};
