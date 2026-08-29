export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="glass mx-auto grid w-full max-w-2xl gap-5 rounded-2xl px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="grid gap-4 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </article>
  );
}
