import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

export function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.portfolios.list();
        setPortfolios(data);
      } catch (e) {
        setError(e.message || 'Unable to load portfolios');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const statusMeta = useMemo(() => ({
    active: { tone: 'success', label: 'Active' },
    new: { tone: 'info', label: 'New' },
    closed: { tone: 'warning', label: 'Closed' }
  }), []);

  const removePortfolio = async (portfolioId) => {
    const confirmed = window.confirm('Delete this portfolio?');
    if (!confirmed) return;

    try {
      await api.portfolios.remove(portfolioId);
      setPortfolios((current) => current.filter((item) => item.id !== portfolioId));
    } catch (e) {
      setError(e.message || 'Unable to delete portfolio');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Portfolio workspace</p>
          <h2 className="mt-1 text-3xl font-bold">Portfolios</h2>
        </div>
        <Link to="/portfolios/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create portfolio
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse p-5">
              <div className="mb-6 h-28 rounded-2xl bg-muted" />
              <div className="mb-3 h-4 w-1/2 rounded bg-muted" />
              <div className="mb-2 h-3 w-3/4 rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {portfolios.map((portfolio) => {
            const meta = statusMeta[portfolio.status] || statusMeta.active;

            return (
              <Card key={portfolio.id} className="overflow-hidden p-0">
                <div className="relative h-28 border-b border-border bg-gradient-to-br from-muted via-background to-muted p-4">
                  <div className="absolute right-4 top-4">
                    <Badge variant={meta.tone}>{meta.label}</Badge>
                  </div>
                  <div className="absolute inset-x-4 bottom-4 flex items-end gap-2">
                    {[30, 45, 60, 75, 93].map((height, index) => (
                      <div key={index} className="flex-1 rounded-t-xl bg-foreground" style={{ height: `${height}%`, opacity: 0.15 + index * 0.12 }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{portfolio.name}</h3>
                      <p className="text-sm text-muted-foreground">{portfolio.theme || 'Theme not set'}</p>
                    </div>
                    <Badge variant="outline">{portfolio.rebalanceFrequency || 'Monthly'}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="rounded-2xl border border-border bg-muted/50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Investment</p>
                      <p className="mt-2 font-semibold text-foreground">{formatMoney(portfolio.amount)}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Benchmark</p>
                      <p className="mt-2 font-semibold text-foreground">{portfolio.benchmark || 'NIFTY50'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Link to={`/portfolios/${portfolio.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full gap-2">
                        Open dashboard
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="px-3 text-red-600 hover:bg-red-500/10 hover:text-red-600"
                      onClick={() => removePortfolio(portfolio.id)}
                      aria-label={`Delete ${portfolio.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
