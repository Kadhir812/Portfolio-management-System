import { NavLink } from 'react-router-dom';
import { BriefcaseBusiness, LayoutDashboard, Wallet, BellRing } from 'lucide-react';
import { Card } from './ui/card';

const navItems = [
  { label: 'Portfolios', to: '/portfolios', icon: BriefcaseBusiness },
  { label: 'Dashboard', to: '/portfolios/overview', icon: LayoutDashboard },
  { label: 'Holdings', to: '/holdings', icon: Wallet },
  { label: 'Alerts', to: '/alerts', icon: BellRing }
];

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-border bg-card p-5 shadow-sm">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                PM
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">System</p>
                <h1 className="text-lg font-semibold">Portfolio Manager</h1>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <Card className="mt-10 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Portfolio health</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">84%</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">+3.2% this month</p>
              </div>
              <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500" />
            </div>
          </Card>
        </aside>

        <main className="flex-1 overflow-x-hidden bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
