import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { HoldingMetrics } from '../components/holdings/HoldingMetrics';
import { AddSecurityForm } from '../components/holdings/AddSecurityForm';
import { AllocationSummary } from '../components/holdings/AllocationSummary';
import { HoldingsTable } from '../components/holdings/HoldingsTable';

export function HoldingsPage() {
  const { id: portfolioId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [attachedTheme, setAttachedTheme] = useState(null);
  const [summary, setSummary] = useState({ holdingCount: 0, totalValue: 0 });
  const [eligibleSecurities, setEligibleSecurities] = useState([]);
  const [selectedAssetClass, setSelectedAssetClass] = useState('');
  const [selectedSecurityId, setSelectedSecurityId] = useState('');
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
    if (!selectedSecurityId || Number(shares) <= 0) {
      setError('Select a security and enter shares greater than zero.');
      return;
    }

    const targetAllocation = attachedTheme?.allocations?.find(
      (allocation) => allocation.assetClass === selectedSecurity?.assetClass
    );
    const currentClassValue = rows
      .filter((row) => row.assetClass === selectedSecurity?.assetClass)
      .reduce((total, row) => total + Number(row.value || 0), 0);
    const proposedClassValue = currentClassValue + Number(selectedSecurity?.latestPrice || 0) * Number(shares);
    const targetClassValue = targetAllocation ? targetAmount * Number(targetAllocation.percentage) / 100 : null;
    if (targetClassValue !== null && proposedClassValue > targetClassValue + 1) {
      setError(`This holding would exceed the ${formatAssetClass(selectedSecurity.assetClass)} target of ${targetAllocation.percentage}%.`);
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.holdings.add(portfolioId, { securityId: Number(selectedSecurityId), shares: Number(shares) });
      setSelectedSecurityId('');
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
      navigate('/portfolios');
    } catch (e) {
      setError(e.message || 'Unable to save holdings');
    } finally {
      setSaving(false);
    }
  };

  const themeAssetClasses = attachedTheme?.allocations
    ?.map((allocation) => allocation.assetClass)
    .filter((assetClass) => assetClass !== 'CASH') || [];
  const investableSecurities = eligibleSecurities.filter((security) => security.assetClass !== 'CASH');
  const visibleSecurities = selectedAssetClass
    ? investableSecurities.filter((security) => security.assetClass === selectedAssetClass)
    : investableSecurities;
  const selectedSecurity = investableSecurities.find((security) => String(security.securityId) === selectedSecurityId);
  const estimatedHoldingValue = Number(selectedSecurity?.latestPrice || 0) * Number(shares || 0);
  const formatAssetClass = (assetClass) => assetClass.replaceAll('_', ' ');
  const targetAmount = Number(portfolio?.amount || 0);
  const currentAllocationByClass = rows.reduce((totals, row) => {
    totals[row.assetClass] = (totals[row.assetClass] || 0) + Number(row.value || 0);
    return totals;
  }, {});
  currentAllocationByClass.CASH = (currentAllocationByClass.CASH || 0)
    + Math.max(targetAmount - Number(summary.totalValue || 0), 0);
  const selectedTargetAllocation = attachedTheme?.allocations?.find(
    (allocation) => allocation.assetClass === selectedSecurity?.assetClass
  );
  const selectedClassValue = currentAllocationByClass[selectedSecurity?.assetClass] || 0;
  const selectedTargetValue = selectedTargetAllocation
    ? targetAmount * Number(selectedTargetAllocation.percentage) / 100
    : 0;
  const remainingTargetValue = Math.max(selectedTargetValue - selectedClassValue, 0);
  const recommendedShares = Number(selectedSecurity?.latestPrice || 0) > 0
    ? remainingTargetValue / Number(selectedSecurity.latestPrice)
    : 0;
  const allocationSummary = (attachedTheme?.allocations || []).map((allocation) => {
    const currentAmount = currentAllocationByClass[allocation.assetClass] || 0;
    const currentPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    return {
      assetClass: allocation.assetClass,
      targetPercentage: Number(allocation.percentage),
      currentPercentage,
      difference: currentPercentage - Number(allocation.percentage),
      requiredAmount: Math.max(targetAmount * Number(allocation.percentage) / 100 - currentAmount, 0)
    };
  });
  const allocationMatches = allocationSummary.length > 0
    && Number(summary.totalValue || 0) <= targetAmount + 1
    && allocationSummary.every((allocation) => Math.abs(allocation.difference) <= 0.5);

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

      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <HoldingMetrics summary={summary} portfolio={portfolio} />

      <AddSecurityForm
        loading={loading}
        saving={saving}
        portfolio={portfolio}
        themeAssetClasses={themeAssetClasses}
        selectedAssetClass={selectedAssetClass}
        setSelectedAssetClass={setSelectedAssetClass}
        visibleSecurities={visibleSecurities}
        selectedSecurityId={selectedSecurityId}
        setSelectedSecurityId={setSelectedSecurityId}
        selectedSecurity={selectedSecurity}
        shares={shares}
        setShares={setShares}
        estimatedHoldingValue={estimatedHoldingValue}
        selectedTargetAllocation={selectedTargetAllocation}
        remainingTargetValue={remainingTargetValue}
        recommendedShares={recommendedShares}
        formatAssetClass={formatAssetClass}
        onAdd={addHolding}
      />

      {attachedTheme ? (
        <AllocationSummary
          targetAmount={targetAmount}
          allocationSummary={allocationSummary}
          allocationMatches={allocationMatches}
          formatAssetClass={formatAssetClass}
        />
      ) : null}

      <HoldingsTable
        rows={rows}
        summary={summary}
        targetAmount={targetAmount}
        saving={saving}
        loading={loading}
        onUpdateShares={updateShares}
        onRemove={removeRow}
        onRefresh={refreshData}
      />
    </div>
  );
}
