import Link from "next/link";
import { Activity, BarChart3 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
    <div className="min-h-dvh flex flex-col">
      <header className="h-14 border-b border-border flex items-center px-6 shrink-0">
        <div className="mx-auto max-w-7xl w-full flex items-center justify-between gap-6">
          <Link href="/">
            <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
              Canary Sales
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/" icon={<Activity className="size-3.5" />}>
              Dashboard
            </NavLink>
            <NavLink href="/campaigns" icon={<BarChart3 className="size-3.5" />}>
              Campaigns
            </NavLink>
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
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
