import { cn } from "@/lib/utils";

export function BrandLogo({
  src,
  name,
  className,
}: {
  src: string | null | undefined;
  name: string;
  className?: string;
}) {
  const url = src?.trim() || null;

  return (
    <div
      role="img"
      aria-label={`${name} logo`}
      className={cn(
        "shrink-0 rounded-md bg-zinc-100 bg-center bg-no-repeat",
        className,
      )}
      style={
        url
          ? {
              backgroundImage: `url("${url}")`,
              backgroundSize: "68%",
            }
          : undefined
      }
    >
      {!url ? (
        <span className="grid h-full w-full place-items-center text-sm font-semibold text-zinc-700">
          {name.slice(0, 1)}
        </span>
      ) : null}
    </div>
  );
}
