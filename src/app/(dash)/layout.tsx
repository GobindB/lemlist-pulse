import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
    <div className="min-h-dvh flex flex-col">
      <header className="h-14 border-b border-border flex items-center shrink-0">
        <div className="mx-auto max-w-7xl w-full px-6 flex items-center justify-between gap-6">
          <Link href="/">
            <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
              Canary Sales
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/campaigns">Campaigns</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
    </TooltipProvider>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-[0.97] [transition:color_150ms_ease,background-color_150ms_ease,transform_150ms_var(--ease-out)]"
    >
      {children}
    </Link>
  );
}
