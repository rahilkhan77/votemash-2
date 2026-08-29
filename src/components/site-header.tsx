import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Battle" },
  { href: "/rankings", label: "Rankings" },
  { href: "/global", label: "Global" },
  { href: "/champion", label: "Champion" },
  { href: "/#enter", label: "Enter" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/25 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight">
          VoteMash
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <nav className="flex max-w-[58vw] items-center gap-1 overflow-x-auto text-sm text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-none sm:gap-3 [&::-webkit-scrollbar]:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-full px-2 py-1 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/40 hover:text-foreground hover:shadow-md sm:px-2.5 dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
