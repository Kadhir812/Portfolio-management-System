import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ArrowUpRight, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

const formatLabel = (value) => value
  ? value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  : 'Not set';

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

  const updatePortfolioStatus = async (portfolio, status) => {
    if (status === portfolio.status) return;
    try {
      setError('');
      const updated = await api.portfolios.update(portfolio.id, {
        name: portfolio.name,
        type: portfolio.type,
        currency: portfolio.currency,
        benchmark: portfolio.benchmark,
        exchange: portfolio.exchange,
        rebalanceFrequency: portfolio.rebalanceFrequency,
        amount: Number(portfolio.amount || 0),
        purchaseDate: portfolio.purchaseDate,
        status
      });
      setPortfolios((current) => current.map((item) => item.id === portfolio.id ? updated : item));
    } catch (e) {
      setError(e.message || 'Unable to update portfolio status');
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
        portfolios.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <h3 className="text-xl font-semibold">No portfolios yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create your first portfolio to start tracking allocations and holdings.</p>
            <Link to="/portfolios/new" className="mt-5 inline-flex">
              <Button className="gap-2"><Plus className="h-4 w-4" />Create portfolio</Button>
            </Link>
          </Card>
        ) : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {portfolios.map((portfolio) => {
            const currentStatus = portfolio.status || (portfolio.holdingsSaved ? 'ACTIVE' : 'NEW');

            return (
              <Card key={portfolio.id} className="overflow-hidden p-0">
                <div className="relative h-28 border-b border-border bg-gradient-to-br from-muted via-background to-muted p-4">
                  <div className="absolute right-4 top-4">
                    <label className="sr-only" htmlFor={`portfolio-status-${portfolio.id}`}>Status for {portfolio.name}</label>
                    <select
                      id={`portfolio-status-${portfolio.id}`}
                      value={currentStatus}
                      onChange={(event) => updatePortfolioStatus(portfolio, event.target.value)}
                      className="rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      <option value="NEW">New</option>
                      <option value="ACTIVE">Active</option>
                      <option value="CLOSED">Closed</option>
                    </select>
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
                      <p className="text-sm text-muted-foreground">{formatLabel(portfolio.theme)}</p>
                    </div>
                    <Badge variant="outline">{formatLabel(portfolio.rebalanceFrequency)}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="rounded-2xl border border-border bg-muted/50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Investment</p>
                        <p className="mt-2 font-semibold text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: portfolio.currency || 'INR', maximumFractionDigits: 0 }).format(portfolio.amount || 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Benchmark</p>
                      <p className="mt-2 font-semibold text-foreground">{portfolio.benchmark || 'NIFTY50'}</p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link to={`/portfolios/${portfolio.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full gap-2">
                        Open dashboard
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Link to={`/portfolios/${portfolio.id}/holdings`}>
                        <Button variant="outline" className="w-full">Holdings</Button>
                      </Link>
                      <Link to={`/portfolios/${portfolio.id}/edit`}>
                        <Button variant="outline" className="w-full gap-2" disabled={portfolio.status === 'CLOSED'} aria-label={`Edit ${portfolio.name}`}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-red-600 hover:bg-red-500/10 hover:text-red-600"
                        onClick={() => removePortfolio(portfolio.id)}
                        aria-label={`Delete ${portfolio.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
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
