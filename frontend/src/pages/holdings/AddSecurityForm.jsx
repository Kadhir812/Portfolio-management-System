import { useEffect, useRef, useState } from 'react';
import { Calculator, Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { formatSubAssetClass } from '../../lib/assetClassUtils';

export function AddSecurityForm({
  loading,
  saving,
  portfolio,
  themeAssetClasses,
  selectedAssetClass,
  setSelectedAssetClass,
  visibleSecurities,
  selectedSecurityId,
  setSelectedSecurityId,
  selectedSecurity,
  shares,
  setShares,
  estimatedHoldingValue,
  selectedTargetAllocation,
  selectedTargetValue,
  selectedTargetPercentage,
  remainingTargetValue,
  recommendedShares,
  formatAssetClass,
  assetClassMetadata,
  onAdd
}) {
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityMenuOpen, setSecurityMenuOpen] = useState(false);
  const securityMenuRef = useRef(null);

  useEffect(() => {
    if (!selectedSecurity) setSecuritySearch('');
  }, [selectedSecurity]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!securityMenuRef.current?.contains(event.target)) setSecurityMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSecurityMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const matchingSecurities = visibleSecurities.filter((security) => {
    const query = securitySearch.trim().toLowerCase();
    if (!query) return true;
    return [security.name, security.symbol, security.isin, security.subAssetClass]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const selectSecurity = (security) => {
    setSelectedSecurityId(String(security.securityId));
    setSecuritySearch(security.symbol || security.name || '');
    setSecurityMenuOpen(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Add security</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-[180px_1fr_180px_auto]">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Theme asset</span>
            <select
            value={selectedAssetClass}
            onChange={(event) => {
              setSelectedAssetClass(event.target.value);
              setSelectedSecurityId('');
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading || saving}
            >
              <option value="">All available assets</option>
              {themeAssetClasses.map((assetClass) => (
                <option key={assetClass} value={assetClass}>{formatAssetClass(assetClass)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Security</span>
            <div ref={securityMenuRef} className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={securitySearch}
                  onChange={(event) => {
                    setSecuritySearch(event.target.value);
                    setSecurityMenuOpen(true);
                    if (selectedSecurityId) setSelectedSecurityId('');
                  }}
                  onFocus={() => setSecurityMenuOpen(true)}
                  placeholder="Search name, symbol, or ISIN"
                  aria-label="Search securities"
                  aria-expanded={securityMenuOpen}
                  className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
                  disabled={loading || saving}
                />
              </div>
              {securityMenuOpen ? (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg" role="listbox">
                  {matchingSecurities.length > 0 ? matchingSecurities.map((security) => (
                    <button
                      key={security.securityId}
                      type="button"
                      role="option"
                      aria-selected={String(security.securityId) === selectedSecurityId}
                      onClick={() => selectSecurity(security)}
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="block font-medium">{security.name || security.symbol}</span>
                      <span className="block text-xs text-muted-foreground">
                        {security.symbol || 'No symbol'} · {security.isin || 'No ISIN'} · {formatAssetClass(security.assetClass)} · {formatSubAssetClass(security.assetClass, security.subAssetClass || assetClassMetadata?.[security.assetClass]?.subAssetClass)} · ₹{Number(security.latestPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </button>
                  )) : (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No matching securities.</p>
                  )}
                </div>
              ) : null}
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Shares</span>
            <div>
              <input
                type="number"
                min="0.0001"
                step="any"
                value={shares}
                onChange={(event) => setShares(event.target.value)}
                placeholder="Shares"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-muted-foreground">Value: ₹{estimatedHoldingValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              {portfolio?.type === 'WEIGHTAGE' && selectedTargetAllocation ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>Per-holding target: ₹{selectedTargetValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({selectedTargetPercentage.toFixed(2)}%) · Remaining: ₹{remainingTargetValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  <button
                    type="button"
                    onClick={() => setShares(recommendedShares.toFixed(4))}
                    disabled={!selectedSecurity || recommendedShares <= 0 || saving}
                    className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Calculator className="h-3 w-3" />
                    Use {recommendedShares.toFixed(4)} recommended shares
                  </button>
                </div>
              ) : null}
            </div>
          </label>
          <div className="flex items-end">
            <Button onClick={onAdd} disabled={loading || saving || !selectedSecurityId} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add holding
            </Button>
          </div>
        </div>

        {selectedSecurity ? (
          <dl className="mt-4 grid gap-x-6 gap-y-3 rounded-md border border-border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs text-muted-foreground">Security</dt>
              <dd className="mt-1 text-sm font-medium">{selectedSecurity.name || selectedSecurity.symbol}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Asset class</dt>
              <dd className="mt-1 text-sm font-medium">
                {selectedSecurity.masterAssetClass
                  ? formatAssetClass(selectedSecurity.masterAssetClass)
                  : formatAssetClass(selectedSecurity.assetClass)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sub-asset class</dt>
              <dd className="mt-1 text-sm font-medium">{formatSubAssetClass(selectedSecurity.assetClass, selectedSecurity.subAssetClass || assetClassMetadata?.[selectedSecurity.assetClass]?.subAssetClass)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Equity category</dt>
              <dd className="mt-1 text-sm font-medium">
                {selectedSecurity.equityCategory?.replaceAll('_', ' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Price</dt>
              <dd className="mt-1 text-sm font-medium">
                ₹{Number(selectedSecurity.latestPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </dd>
            </div>
          </dl>
        ) : null}

        <p className="mt-3 text-xs text-muted-foreground">Cash is managed automatically as the uninvested residual; select market assets here.</p>
      </CardContent>
    </Card>
  );
}