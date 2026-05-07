import Link from "next/link";
import { Activity, BarChart3 } from "lucide-react";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center">
            <span className="text-sm font-semibold uppercase tracking-[0.22em]">
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
