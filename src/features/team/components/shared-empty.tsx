import { TeamBoard } from '@/features/team/types/team.types';

type SharedEmptyProps = {
  memberChallenges: TeamBoard['memberChallenges'];
};

export const SharedEmpty = ({ memberChallenges }: SharedEmptyProps) => {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-5">
      <h3 className="text-base font-bold">No shared challenges yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Here is what everyone is working on.</p>
      <ul className="mt-4 flex flex-col gap-4">
        {memberChallenges.map((m) => (
          <li key={m.userId}>
            <p className="text-sm font-semibold">{m.name}</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {m.challenges.map((c) => (
                <li key={c.key} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {c.title}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};
