export function SetupNotice({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">VoteMash needs a database</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Copy `.env.example` to `.env.local`, add Neon `DATABASE_URL` and
        `VOTER_COOKIE_SECRET`, then run `npm run db:push` and `npm run db:seed`.
      </p>
    </div>
  );
}
