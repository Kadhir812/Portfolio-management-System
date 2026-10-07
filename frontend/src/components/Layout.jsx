import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BellRing, BriefcaseBusiness, ChevronLeft, ChevronRight, Database, LayoutDashboard, Layers, LogOut, Scale, Wallet } from 'lucide-react';
import { Brand } from './AuthShell';
import { cn } from '../lib/utils';

const mainNav = [
  { label: 'Portfolios', to: '/portfolios', icon: BriefcaseBusiness, end: true },
  { label: 'Themes', to: '/themes', icon: Layers },
  // { label: 'Securities', to: '/securities', icon: Database },
  { label: 'Alerts', to: '/alerts', icon: BellRing }
];

const linkClass = ({ isActive }) => cn(
  'flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition',
  isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
);

function currentUserName() {
  try {
    return JSON.parse(localStorage.getItem('portfolio_user'))?.username || 'Account';
  } catch {
    return 'Account';
  }
}

export function Layout({ children }) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isStandalonePage = pathname === '/securities';
  const portfolioId = pathname.match(/^\/portfolios\/(\d+)/)?.[1];
  const portfolioNav = portfolioId ? [
    { label: 'Dashboard', to: `/portfolios/${portfolioId}`, icon: LayoutDashboard, end: true },
    { label: 'Holdings', to: `/portfolios/${portfolioId}/holdings`, icon: Wallet },
    { label: 'Rebalance', to: `/portfolios/${portfolioId}/rebalance`, icon: Scale }
  ] : [];

  const signOut = () => {
    localStorage.removeItem('portfolio_token');
    localStorage.removeItem('portfolio_user');
    window.location.href = '/login';
  };

  return (
    <div className={isStandalonePage ? 'min-h-screen' : 'min-h-screen lg:flex'}>
      {!isStandalonePage && (
        <aside className={cn(
          'hidden shrink-0 flex-col border-r border-border bg-card/60 p-4 transition-all duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen',
          sidebarOpen ? 'w-60' : 'w-20'
        )}>
          <div className="flex items-center justify-between gap-2 px-2 py-3">
            {sidebarOpen ? <Brand /> : <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">P</div>}
            <button
              type="button"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          <nav className="mt-6 space-y-1" aria-label="Main">
            {mainNav.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => cn(
                  linkClass({ isActive }),
                  sidebarOpen ? 'justify-start' : 'justify-center',
                  !sidebarOpen && 'px-2'
                )}
              >
                <Icon className="h-4 w-4" />
                {sidebarOpen && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border px-2 pt-4">
            {sidebarOpen ? <span className="truncate text-sm font-medium">{currentUserName()}</span> : <span className="sr-only">Account</span>}
            <button type="button" onClick={signOut} title="Sign out" aria-label="Sign out" className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {isStandalonePage ? (
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur sm:px-8">
            <Brand />
            <div className="flex items-center gap-2">
              <ColorModeToggle />
              <button type="button" onClick={signOut} title="Sign out" aria-label="Sign out" className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>
        ) : (
          <>
            <header className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card/60 px-3 py-2 lg:hidden">
              {[...mainNav, ...portfolioNav].map(({ label, to, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={linkClass}><Icon className="h-4 w-4" />{label}</NavLink>
              ))}
              <span className="ml-auto flex items-center gap-1"><button type="button" onClick={signOut} className="rounded-md p-2 text-muted-foreground" aria-label="Sign out"><LogOut className="h-4 w-4" /></button></span>
            </header>
          </>
        )}

        {portfolioNav.length > 0 && (
          <div className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Portfolio sections">
              {portfolioNav.map(({ label, to, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => cn(
                    'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition',
                    isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1500px] space-y-6 overflow-x-hidden p-4 sm:p-6 lg:px-8 lg:pb-8 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
