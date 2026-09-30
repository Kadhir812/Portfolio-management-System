import { NavLink, useLocation } from 'react-router-dom';
import { BriefcaseBusiness, LayoutDashboard, BellRing, Database, LogOut } from 'lucide-react';
import { Card } from './ui/card';

const navItems = [
  { label: 'Portfolios', to: '/portfolios', icon: BriefcaseBusiness },
  { label: 'Securities', to: '/securities', icon: Database },
  { label: 'Dashboard', to: '/portfolios/overview', icon: LayoutDashboard },
  { label: 'Alerts', to: '/alerts', icon: BellRing }
];

export function Layout({ children }) {
  const location = useLocation();
  const portfolioMatch = location.pathname.match(/^\/portfolios\/([^/]+)/);
  const dashboardPath = portfolioMatch ? `/portfolios/${portfolioMatch[1]}` : '/portfolios/overview';
  const currentNavItems = navItems.map((item) =>
    item.label === 'Dashboard' ? { ...item, to: dashboardPath } : item
  );

  const logout = () => {
    localStorage.removeItem('portfolio_token');
    localStorage.removeItem('portfolio_user');
    window.location.href = '/login';
  };

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
            {currentNavItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                end={label === 'Portfolios'}
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

          <button
            type="button"
            onClick={logout}
            className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <main className="flex-1 overflow-x-hidden bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
