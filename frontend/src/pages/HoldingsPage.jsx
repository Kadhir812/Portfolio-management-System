import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, RefreshCcw } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function HoldingsPage() {
  const { id: portfolioId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [attachedTheme, setAttachedTheme] = useState(null);
  const [summary, setSummary] = useState({ holdingCount: 0, totalValue: 0 });
  const [eligibleSecurities, setEligibleSecurities] = useState([]);
  const [selectedAssetClass, setSelectedAssetClass] = useState('');
  const [selectedIsin, setSelectedIsin] = useState('');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!portfolioId) {
      setError('Select a portfolio to view holdings.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [portfolioData, holdingData, summaryData, eligibleData, themeData, themeDefinitions] = await Promise.all([
          api.portfolios.get(portfolioId),
          api.holdings.list(portfolioId),
          api.holdings.summary(portfolioId),
          api.holdings.eligibleSecurities(portfolioId),
          api.themes.get(portfolioId).catch(() => null),
          api.themes.list().catch(() => [])
        ]);
        setPortfolio(portfolioData);
        setAttachedTheme(themeData || themeDefinitions.find((theme) => theme.theme === portfolioData.theme) || null);
        setRows(holdingData);
        setSummary(summaryData);
        setEligibleSecurities(eligibleData);
      } catch (e) {
        setError(e.message || 'Unable to load holdings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [portfolioId]);

  const refreshData = async () => {
    const [portfolioData, holdingData, summaryData, eligibleData, themeData, themeDefinitions] = await Promise.all([
      api.portfolios.get(portfolioId),
      api.holdings.list(portfolioId),
      api.holdings.summary(portfolioId),
      api.holdings.eligibleSecurities(portfolioId),
      api.themes.get(portfolioId).catch(() => null),
      api.themes.list().catch(() => [])
    ]);
    setPortfolio(portfolioData);
    setAttachedTheme(themeData || themeDefinitions.find((theme) => theme.theme === portfolioData.theme) || null);
    setRows(holdingData);
    setSummary(summaryData);
    setEligibleSecurities(eligibleData);
  };

  const addHolding = async () => {
    if (!selectedIsin || Number(shares) <= 0) {
      setError('Select a security and enter shares greater than zero.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.holdings.add(portfolioId, { isin: selectedIsin, shares: Number(shares) });
      setSelectedIsin('');
      setShares('');
      await refreshData();
    } catch (e) {
      setError(e.message || 'Unable to add holding');
    } finally {
      setSaving(false);
    }
  };

  const updateShares = async (holdingId, value) => {
    if (Number(value) <= 0) return;

    try {
      setSaving(true);
      setError('');
      await api.holdings.update(portfolioId, holdingId, { shares: Number(value) });
      await refreshData();
    } catch (e) {
      setError(e.message || 'Unable to update holding');
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (holdingId) => {
    try {
      setSaving(true);
      setError('');
      await api.holdings.remove(portfolioId, holdingId);
      await refreshData();
    } catch (e) {
      setError(e.message || 'Unable to remove holding');
    } finally {
      setSaving(false);
    }
  };

  const saveHoldings = async () => {
    try {
      setSaving(true);
      setError('');
      await api.holdings.save(portfolioId);
      navigate(`/portfolios/${portfolioId}`);
    } catch (e) {
      setError(e.message || 'Unable to save holdings');
    } finally {
      setSaving(false);
    }
  };

  const themeAssetClasses = attachedTheme?.allocations?.map((allocation) => allocation.assetClass) || [];
  const visibleSecurities = selectedAssetClass
    ? eligibleSecurities.filter((security) => security.assetClass === selectedAssetClass)
    : eligibleSecurities;
  const formatAssetClass = (assetClass) => assetClass.replaceAll('_', ' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Asset management</p>
          <h2 className="mt-1 text-3xl font-bold">Holdings</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/portfolios" className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
            Portfolios
          </Link>
          <Button className="gap-2" onClick={saveHoldings} disabled={!portfolioId || loading || saving}>
            <Save className="h-4 w-4" />
            Save holdings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Holdings count</p>
          <p className="mt-2 text-2xl font-bold">{summary.holdingCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Residual cash</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            ₹{Math.max(Number(portfolio?.amount || 0) - Number(summary.totalValue || 0), 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Uninvested remainder available after price rounding</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total value</p>
          <p className="mt-2 text-2xl font-bold">₹{Number(summary.totalValue || 0).toLocaleString('en-IN')}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[180px_1fr_180px_auto]">
            <select
              value={selectedAssetClass}
              onChange={(event) => {
                setSelectedAssetClass(event.target.value);
                setSelectedIsin('');
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading || saving}
            >
              <option value="">All theme assets</option>
              {themeAssetClasses.map((assetClass) => (
                <option key={assetClass} value={assetClass}>
                  {formatAssetClass(assetClass)}
                </option>
              ))}
            </select>
            <select
              value={selectedIsin}
              onChange={(event) => setSelectedIsin(event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading || saving}
            >
              <option value="">Select eligible security</option>
              {visibleSecurities.map((security) => (
                <option key={security.isin} value={security.isin}>
                  {security.symbol} - {formatAssetClass(security.assetClass)} - ₹{Number(security.latestPrice || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.0001"
              step="any"
              value={shares}
              onChange={(event) => setShares(event.target.value)}
              placeholder="Shares"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={saving}
            />
            <Button onClick={addHolding} disabled={loading || saving || !selectedIsin} className="gap-2">
              <Plus className="h-4 w-4" />
              Add holding
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">The backend calculates the latest price and enforces the selected theme allocation limit.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Portfolio allocation</CardTitle>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">Live backend data</Badge>
              <Badge variant="secondary">{summary.holdingCount} holdings</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
          {loading ? <p className="mb-4 text-sm text-muted-foreground">Loading holdings...</p> : null}
          {!loading && rows.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">No holdings yet. Add an eligible security above.</p> : null}
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">S.No</th>
                  <th className="px-3 py-3 font-medium">Asset class</th>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">No. of shares</th>
                  <th className="px-3 py-3 font-medium">Price / share</th>
                  <th className="px-3 py-3 font-medium">Total value</th>
                  <th className="px-3 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-border align-middle">
                    <td className="px-3 py-3">{index + 1}</td>
                    <td className="px-3 py-3">
                      <input
                        value={row.assetClass || ''}
                        readOnly
                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={row.securityName || row.symbol || ''}
                        readOnly
                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.shares || 0}
                        onChange={(event) => updateShares(row.id, event.target.value)}
                        disabled={saving}
                        className="w-24 rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.price || 0}
                        readOnly
                        className="w-28 rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium">₹{Number(row.value || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-600"
                        onClick={() => removeRow(row.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" className="gap-2" onClick={refreshData} disabled={loading || saving}>
              <RefreshCcw className="h-4 w-4" />
              Refresh data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
