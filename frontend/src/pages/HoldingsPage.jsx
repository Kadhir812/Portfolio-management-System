import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { getEqualHoldingTargets } from '../lib/utils';
import { HoldingsPageHeader } from './holdings/HoldingsPageHeader';
import { HoldingsWorkspace } from './holdings/HoldingsWorkspace';
import { eligiblePriceDate, formatAssetClass } from './holdings/holdingsUtils';
import { assetClassMap } from '../lib/assetClassUtils';

export function HoldingsPage() {
  const { id: portfolioId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [attachedTheme, setAttachedTheme] = useState(null);
  const [summary, setSummary] = useState({ holdingCount: 0, totalValue: 0 });
  const [eligibleSecurities, setEligibleSecurities] = useState([]);
  const [assetClassMetadata, setAssetClassMetadata] = useState({});
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
        const portfolioData = await api.portfolios.get(portfolioId);
        const [holdingData, summaryData, eligibleData, themeData, themeDefinitions, assetClasses] = await Promise.all([
          api.holdings.list(portfolioId),
          api.holdings.summary(portfolioId),
          api.holdings.eligibleSecurities(portfolioId, eligiblePriceDate(portfolioData)),
          api.themes.get(portfolioId).catch(() => null),
          api.themes.list().catch(() => []),
          api.assetClasses.list()
        ]);
        setPortfolio(portfolioData);
        setAttachedTheme(themeData || themeDefinitions.find((theme) => theme.theme === portfolioData.theme) || null);
        setRows(holdingData);
        setSummary(summaryData);
        setEligibleSecurities(eligibleData);
        setAssetClassMetadata(assetClassMap(assetClasses));
      } catch (e) {
        setError(e.message || 'Unable to load holdings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [portfolioId]);

  const refreshData = async () => {
    const portfolioData = await api.portfolios.get(portfolioId);
    const [holdingData, summaryData, eligibleData, themeData, themeDefinitions, assetClasses] = await Promise.all([
      api.holdings.list(portfolioId),
      api.holdings.summary(portfolioId),
      api.holdings.eligibleSecurities(portfolioId, eligiblePriceDate(portfolioData)),
      api.themes.get(portfolioId).catch(() => null),
      api.themes.list().catch(() => []),
      api.assetClasses.list()
    ]);
    setPortfolio(portfolioData);
    setAttachedTheme(themeData || themeDefinitions.find((theme) => theme.theme === portfolioData.theme) || null);
    setRows(holdingData);
    setSummary(summaryData);
    setEligibleSecurities(eligibleData);
    setAssetClassMetadata(assetClassMap(assetClasses));
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
      setError(`This holding would exceed the ${formatAssetClass(selectedSecurity.assetClass, assetClassMetadata)} target of ${targetAllocation.percentage}%.`);
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
    if (Number(value) <= 0) return false;

    try {
      setSaving(true);
      setError('');
      await api.holdings.update(portfolioId, holdingId, { shares: Number(value) });
      await refreshData();
      return true;
    } catch (e) {
      setError(e.message || 'Unable to update holding');
      return false;
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

  const investableSecurities = eligibleSecurities.filter((security) => security.assetClass !== 'CASH');
  const themeAssetClasses = attachedTheme?.allocations
    ?.map((allocation) => allocation.assetClass)
    .filter((assetClass) => assetClass !== 'CASH') || [];
  const availableAssetClasses = [...new Set(investableSecurities.map((security) => security.assetClass))];
  const masterAssetClasses = Object.keys(assetClassMetadata).filter((assetClass) => assetClass !== 'CASH');
  const selectableAssetClasses = themeAssetClasses.length > 0
    ? themeAssetClasses
    : [...new Set([...masterAssetClasses, ...availableAssetClasses])];
  const visibleSecurities = selectedAssetClass
    ? investableSecurities.filter((security) => security.assetClass === selectedAssetClass)
    : investableSecurities;
  const selectedSecurity = investableSecurities.find((security) => String(security.securityId) === selectedSecurityId);
  const estimatedHoldingValue = Number(selectedSecurity?.latestPrice || 0) * Number(shares || 0);
  const targetAmount = Number(portfolio?.amount || 0);
  const holdingsWithTargets = getEqualHoldingTargets(rows, attachedTheme?.allocations || [], targetAmount);
  const currentAllocationByClass = rows.reduce((totals, row) => {
    totals[row.assetClass] = (totals[row.assetClass] || 0) + Number(row.value || 0);
    return totals;
  }, {});
  const equityCategorySummary = ['LARGE_CAP', 'MID_CAP', 'SMALL_CAP'].map((equityCategory) => {
    const currentValue = rows
      .filter((row) => row.assetClass === 'EQUITY' && row.equityCategory === equityCategory)
      .reduce((total, row) => total + Number(row.value || 0), 0);
    return {
      equityCategory,
      currentValue,
      currentPercentage: targetAmount > 0 ? currentValue / targetAmount * 100 : 0,
      targetPercentage: Number(attachedTheme?.equityAllocations
        ?.find((allocation) => allocation.equityCategory === equityCategory)?.percentage || 0),
      targetValue: targetAmount * Number(attachedTheme?.equityAllocations
        ?.find((allocation) => allocation.equityCategory === equityCategory)?.percentage || 0) / 100
    };
  });
  currentAllocationByClass.CASH = (currentAllocationByClass.CASH || 0)
    + Math.max(targetAmount - Number(summary.totalValue || 0), 0);
  const selectedTargetAllocation = attachedTheme?.allocations?.find(
    (allocation) => allocation.assetClass === selectedSecurity?.assetClass
  );
  const selectedExistingHolding = rows.find((row) => Number(row.securityId) === Number(selectedSecurity?.securityId));
  const selectedClassHoldingCount = rows.filter((row) => row.assetClass === selectedSecurity?.assetClass).length
    + (selectedExistingHolding ? 0 : 1);
  const selectedClassTargetValue = selectedTargetAllocation
    ? targetAmount * Number(selectedTargetAllocation.percentage) / 100
    : 0;
  const selectedTargetValue = selectedTargetAllocation && selectedClassHoldingCount > 0
    ? selectedClassTargetValue / selectedClassHoldingCount
    : 0;
  const selectedTargetPercentage = targetAmount > 0 ? selectedTargetValue / targetAmount * 100 : 0;
  const remainingClassTargetValue = Math.max(
    selectedClassTargetValue - (currentAllocationByClass[selectedSecurity?.assetClass] || 0),
    0
  );
  const remainingTargetValue = Math.min(
    Math.max(selectedTargetValue - Number(selectedExistingHolding?.value || 0), 0),
    remainingClassTargetValue
  );
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
      <HoldingsPageHeader portfolioId={portfolioId} loading={loading} saving={saving} onSave={saveHoldings} />
      <HoldingsWorkspace
        error={error}
        summary={summary}
        portfolio={portfolio}
        hasTheme={Boolean(attachedTheme)}
        targetAmount={targetAmount}
        addSecurityProps={{
          loading,
          saving,
          portfolio,
          themeAssetClasses: selectableAssetClasses,
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
          formatAssetClass: (assetClass) => formatAssetClass(assetClass, assetClassMetadata),
          assetClassMetadata,
          onAdd: addHolding
        }}
        allocationSummary={allocationSummary}
        equityCategorySummary={equityCategorySummary}
        allocationMatches={allocationMatches}
        formatAssetClass={(assetClass) => formatAssetClass(assetClass, assetClassMetadata)}
        holdingsTableProps={{
          rows: holdingsWithTargets,
          summary,
          targetAmount,
          saving,
          loading,
          onUpdateShares: updateShares,
          onRemove: removeRow,
          onRefresh: refreshData
        }}
      />
    </div>
  );
}
