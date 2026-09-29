import { Calculator, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
  remainingTargetValue,
  recommendedShares,
  formatAssetClass,
  onAdd
}) {
  return (
    <Card>
      <CardHeader><CardTitle>Add security</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-[180px_1fr_180px_auto]">
          <select
            value={selectedAssetClass}
            onChange={(event) => {
              setSelectedAssetClass(event.target.value);
              setSelectedSecurityId('');
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading || saving}
          >
            <option value="">All theme assets</option>
            {themeAssetClasses.map((assetClass) => (
              <option key={assetClass} value={assetClass}>{formatAssetClass(assetClass)}</option>
            ))}
          </select>
          <select
            value={selectedSecurityId}
            onChange={(event) => setSelectedSecurityId(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading || saving}
          >
            <option value="">Select eligible security</option>
            {visibleSecurities.map((security) => (
              <option key={security.securityId} value={security.securityId}>
                {security.symbol} - {formatAssetClass(security.assetClass)} - ₹{Number(security.latestPrice || 0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
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
                <p>Target: {selectedTargetAllocation.percentage}% · Remaining: ₹{remainingTargetValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
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
          <Button onClick={onAdd} disabled={loading || saving || !selectedSecurityId} className="gap-2">
            <Plus className="h-4 w-4" />
            Add holding
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Cash is managed automatically as the uninvested residual; select market assets here.</p>
      </CardContent>
    </Card>
  );
}
