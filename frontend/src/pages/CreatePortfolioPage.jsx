import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Filter } from 'lucide-react';
import { api } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { localDateString } from '../lib/utils';
import { horizonOptions, themePayload, validateThemeDraft, riskOptions } from '../lib/themeConfig';
import { assetClassMap, formatAssetClass } from '../lib/assetClassUtils';

const DataGrid = lazy(() => import('../components/ui/DataGrid').then((module) => ({ default: module.DataGrid })));

const steps = ['Portfolio Setup', 'Theme Selection', 'Holdings'];

const typeOptions = [
  { value: 'WEIGHTAGE', label: 'Percentage' },
  { value: 'AMOUNT', label: 'Rupee amount' }
];
const currencyOptions = ['INR', 'USD', 'GBP'];
const exchangeOptions = ['NSE', 'BSE'];
const rebalanceOptions = ['DAILY', 'WEEKLY', 'MONTHLY'];
const portfolioStatusOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' }
];
const benchmarkOptions = ['NIFTY50', 'NASDAQ', 'SMP500'];
const themeRiskOrder = {
  CONSERVATIVE: 0,
  MODERATELY_CONSERVATIVE: 1,
  MODERATELY_AGGRESSIVE: 2,
  AGGRESSIVE: 3,
  VERY_AGGRESSIVE: 4
};
const riskLevels = ['Low', 'Moderate', 'High', 'Very High'];
const investmentDurations = ['Short Term', 'Medium Term', 'Long Term'];

const RiskCycleHeader = (params) => {
  const [activeRiskIndex, setActiveRiskIndex] = useState(-1);
  const activeRisk = activeRiskIndex >= 0 ? riskLevels[activeRiskIndex] : null;

  const cycleRiskFilter = async () => {
    const nextIndex = activeRiskIndex + 1;
    const nextRisk = riskLevels[nextIndex] || null;
    await params.api.setColumnFilterModel('risk', nextRisk
      ? { filterType: 'text', type: 'equals', filter: nextRisk }
      : null);
    params.api.onFilterChanged();
    setActiveRiskIndex(nextRisk ? nextIndex : -1);
  };

  return (
    <button
      type="button"
      onClick={cycleRiskFilter}
      aria-label={`Filter themes by risk. Current filter: ${activeRisk || 'All'}. Click to cycle.`}
      className="flex h-full w-full items-center gap-2 text-left font-semibold"
    >
      <Filter className="h-3.5 w-3.5 shrink-0 text-sky-700" />
      <span>Risk</span>
      <span className="truncate text-xs font-normal text-muted-foreground">{activeRisk || 'All'}</span>
    </button>
  );
}

const InvestmentDurationHeader = (params) => {
  const [activeDurationIndex, setActiveDurationIndex] = useState(-1);
  const activeDuration = activeDurationIndex >= 0 ? investmentDurations[activeDurationIndex] : null;

  const cycleDurationFilter = async () => {
    const nextIndex = activeDurationIndex + 1;
    const nextDuration = investmentDurations[nextIndex] || null;
    await params.api.setColumnFilterModel('investmentHorizon', nextDuration
      ? { filterType: 'text', type: 'equals', filter: nextDuration }
      : null);
    params.api.onFilterChanged();
    setActiveDurationIndex(nextDuration ? nextIndex : -1);
  };

  return (
    <button
      type="button"
      onClick={cycleDurationFilter}
      aria-label={`Filter themes by investment duration. Current filter: ${activeDuration || 'All'}. Click to cycle.`}
      className="flex h-full w-full items-center gap-2 text-left font-semibold"
    >
      <Filter className="h-3.5 w-3.5 shrink-0 text-sky-700" />
      <span>Investment duration</span>
      <span className="truncate text-xs font-normal text-muted-foreground">{activeDuration || 'All'}</span>
    </button>
  );
};

export function CreatePortfolioPage() {
  const navigate = useNavigate();
  const { id: editingPortfolioId } = useParams();
  const isEditing = Boolean(editingPortfolioId);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    type: 'AMOUNT',
    currency: 'INR',
    benchmark: 'NIFTY50',
    exchange: 'NSE',
    rebalanceFrequency: 'MONTHLY',
    amount: 100000,
    purchaseDate: localDateString(),
    status: 'NEW'
  });
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [themes, setThemes] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [assetClassMetadata, setAssetClassMetadata] = useState({});
  const [createdPortfolioId, setCreatedPortfolioId] = useState(null);
  const [holdingsSaved, setHoldingsSaved] = useState(false);
  const [editingThemeTargets, setEditingThemeTargets] = useState(false);
  const [themeTargetDraft, setThemeTargetDraft] = useState([]);
  const [editingThemeDefinition, setEditingThemeDefinition] = useState(false);
  const [themeDefinitionDraft, setThemeDefinitionDraft] = useState(null);
  const [portfolioLoaded, setPortfolioLoaded] = useState(!isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const [themeData, assetClasses] = await Promise.all([
          api.themes.list(),
          api.assetClasses.list()
        ]);
        setThemes(themeData);
        setAssetClassMetadata(assetClassMap(assetClasses));
      } catch (e) {
        setError(e.message || 'Unable to load investment themes');
      } finally {
        setLoadingThemes(false);
      }
    };

    loadThemes();
  }, []);

  useEffect(() => {
    if (!editingPortfolioId) return;

    api.portfolios.get(editingPortfolioId)
      .then((portfolio) => {
        setForm({
          name: portfolio.name || '',
          type: portfolio.type || 'AMOUNT',
          currency: portfolio.currency || 'INR',
          benchmark: portfolio.benchmark || 'NIFTY50',
          exchange: portfolio.exchange || 'NSE',
          rebalanceFrequency: portfolio.rebalanceFrequency || 'MONTHLY',
          amount: portfolio.amount || 0,
          purchaseDate: portfolio.purchaseDate || localDateString(),
          status: portfolio.status || (portfolio.holdingsSaved ? 'ACTIVE' : 'NEW')
        });
        setCreatedPortfolioId(portfolio.id);
        setSelectedTheme(portfolio.theme || null);
        setHoldingsSaved(Boolean(portfolio.holdingsSaved));
        setPortfolioLoaded(true);
      })
      .catch((e) => {
        setError(e.message || 'Unable to load portfolio');
        setPortfolioLoaded(true);
      });
  }, [editingPortfolioId]);

  const selectedThemeData = useMemo(
    () => themes.find((item) => item.theme === selectedTheme) || null,
    [selectedTheme, themes]
  );
  const themeColumns = useMemo(() => [
    {
      headerName: 'Theme',
      field: 'label',
      sort: 'asc',
      sortingOrder: ['asc', 'desc'],
      sortable: true,
      comparator: (_valueA, _valueB, nodeA, nodeB) =>
        (themeRiskOrder[nodeA.data.theme] ?? Number.MAX_SAFE_INTEGER)
        - (themeRiskOrder[nodeB.data.theme] ?? Number.MAX_SAFE_INTEGER),
      flex: 1,
      minWidth: 170
    },
    {
      headerName: 'Asset allocation',
      field: 'allocations',
      sortable: false,
      filter: false,
      valueFormatter: ({ value }) => (value || [])
        .map((allocation) => `${formatAssetClass(allocation.assetClass, assetClassMetadata)} ${allocation.percentage}%`)
        .join(' · '),
      flex: 2,
      minWidth: 300,
      wrapText: true,
      autoHeight: true
    },
    {
      headerName: 'Risk',
      field: 'risk',
      sortable: false,
      filter: 'agTextColumnFilter',
      headerComponent: RiskCycleHeader,
      minWidth: 130
    },
    {
      headerName: 'Investment duration',
      field: 'investmentHorizon',
      sortable: true,
      filter: 'agTextColumnFilter',
      headerComponent: InvestmentDurationHeader,
      minWidth: 180
    }
  ], [assetClassMetadata]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleCreateBasePortfolio = async () => {
    try {
      setSaving(true);
      setError('');
      const payload = {
        ...form,
        amount: Number(form.amount),
        purchaseDate: form.purchaseDate
      };

      if (isEditing) {
        await api.portfolios.update(editingPortfolioId, payload);
        if (!selectedTheme) {
          setCurrentStep(1);
          return;
        }
        if (!holdingsSaved) {
          setCurrentStep(2);
          return;
        }
        navigate(`/portfolios/${editingPortfolioId}`);
        return;
      }

      const created = await api.portfolios.create(payload);
      setCreatedPortfolioId(created.id);
      setSelectedTheme(null);
      setCurrentStep(1);
    } catch (e) {
      setError(e.message || 'Unable to create portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeNext = async () => {
    if (!selectedTheme) {
      setError('Choose one investment theme to continue.');
      return;
    }

    if (!createdPortfolioId) {
      setError('Create the portfolio first before attaching a theme.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.themes.attach(createdPortfolioId, selectedTheme);
      setCurrentStep(2);
    } catch (e) {
      setError(e.message || 'Unable to attach the selected theme.');
    } finally {
      setSaving(false);
    }
  };

  const startEditingThemeTargets = () => {
    setThemeTargetDraft(selectedThemeData?.equityAllocations?.map((allocation) => ({
      equityCategory: allocation.equityCategory,
      percentage: allocation.percentage
    })) || []);
    setEditingThemeTargets(true);
  };

  const saveThemeTargets = async () => {
    const validationError = validateThemeDraft({
      label: selectedThemeData.label,
      risk: selectedThemeData.risk,
      investmentHorizon: selectedThemeData.investmentHorizon,
      description: selectedThemeData.description || '',
      allocations: selectedThemeData.allocations
    }, themeTargetDraft);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updated = await api.themes.updateDefinition(
        selectedThemeData.theme,
        themePayload(selectedThemeData, themeTargetDraft)
      );
      setThemes((current) => current.map((theme) => theme.theme === updated.theme ? updated : theme));
      setEditingThemeTargets(false);
    } catch (e) {
      setError(e.message || 'Unable to save theme configuration');
    } finally {
      setSaving(false);
    }
  };

  const startEditingThemeDefinition = () => {
    setThemeDefinitionDraft({
      label: selectedThemeData.label,
      risk: selectedThemeData.risk,
      investmentHorizon: selectedThemeData.investmentHorizon,
      description: selectedThemeData.description || '',
      allocations: selectedThemeData.allocations.map((allocation) => ({
        assetClass: allocation.assetClass,
        percentage: allocation.percentage
      }))
    });
    setEditingThemeDefinition(true);
  };

  const saveThemeDefinition = async () => {
    const validationError = validateThemeDraft(themeDefinitionDraft, selectedThemeData.equityAllocations);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updated = await api.themes.updateDefinition(
        selectedThemeData.theme,
        themePayload(themeDefinitionDraft, selectedThemeData.equityAllocations)
      );
      setThemes((current) => current.map((theme) => theme.theme === updated.theme ? updated : theme));
      setEditingThemeDefinition(false);
    } catch (e) {
      setError(e.message || 'Unable to update theme details');
    } finally {
      setSaving(false);
    }
  };

  const stepIndicator = (index) => (
    <div key={steps[index]} className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
          index <= currentStep
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-slate-700 bg-slate-900 text-slate-400'
        }`}
      >
        {index + 1}
      </div>
      <span className="text-sm text-slate-300">{steps[index]}</span>
      {index < steps.length - 1 ? <div className="h-px w-8 bg-slate-700" /> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit portfolio' : 'Create portfolio'}
        description={isEditing ? 'Update the portfolio settings and preserve its selected theme.' : 'Define the portfolio, choose the best-matching theme, and finalize allocation.'}
        rightAction={
          <Link to="/portfolios" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center gap-3">{steps.map((_, index) => stepIndicator(index))}</div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {currentStep === 0 ? (
        <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-800 bg-slate-900/60 p-6 shadow-soft">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Portfolio name</span>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-0 transition focus:border-brand-500"
                  placeholder="Example: Growth Plus"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Portfolio type</span>
                  <select
                    value={form.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Currency</span>
                  <select
                    value={form.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Benchmark</span>
                  <select
                    value={form.benchmark}
                    onChange={(e) => updateField('benchmark', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                  >
                    {benchmarkOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Exchange</span>
                  <select
                    value={form.exchange}
                    onChange={(e) => updateField('exchange', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                  >
                    {exchangeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Rebalancing frequency</span>
                <select
                  value={form.rebalanceFrequency}
                  onChange={(e) => updateField('rebalanceFrequency', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                >
                  {rebalanceOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Portfolio status</span>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                >
                  {portfolioStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-slate-500">Active and closed statuses require saved holdings.</span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Asset purchase date</span>
                <input
                  type="date"
                  value={form.purchaseDate}
                  max={localDateString()}
                  disabled={isEditing}
                  onChange={(e) => updateField('purchaseDate', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                />
                <span className="mt-1 block text-xs text-slate-500">Historical prices on this date are used as your starting purchase prices.</span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Total amount to be invested</span>
                <input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                />
              </label>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Summary</p>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between"><span>Portfolio</span><strong>{form.name || 'Unnamed'}</strong></div>
                  <div className="flex justify-between"><span>Type</span><strong>{form.type}</strong></div>
                  <div className="flex justify-between"><span>Currency</span><strong>{form.currency}</strong></div>
                  <div className="flex justify-between"><span>Invested</span><strong>₹{Number(form.amount).toLocaleString('en-IN')}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleCreateBasePortfolio}
              disabled={saving || !form.name.trim() || !portfolioLoaded}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (isEditing ? 'Updating portfolio...' : 'Saving portfolio...') : (isEditing ? 'Update portfolio' : 'Save portfolio')}
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-6">
          {selectedThemeData && <p className="text-sm text-slate-300">Selected: <span className="font-semibold text-white">{selectedThemeData.label}</span></p>}
          <Suspense fallback={<div className="rounded-lg border border-slate-700 bg-white p-5 text-sm text-slate-600">Loading theme grid…</div>}>
            <DataGrid
              rowData={themes}
              columnDefs={themeColumns}
              getRowId={({ data }) => data.theme}
              selectedRowId={selectedTheme}
              onSelectionChange={(theme) => setSelectedTheme(theme?.theme || null)}
              loading={loadingThemes}
              height={380}
            />
          </Suspense>

          {!loadingThemes && themes.length === 0 ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              No investment themes are available. Check the backend connection and try again.
            </div>
          ) : null}

          {selectedThemeData?.equityAllocations?.length ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">Equity category targets</h3>
                  <p className="mt-1 text-sm text-slate-400">These shared targets are used by portfolios using this theme.</p>
                </div>
                {!editingThemeTargets ? (
                  <button type="button" onClick={startEditingThemeTargets} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200">
                    Edit targets
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={saveThemeTargets} disabled={saving} className="rounded-xl bg-sky-300 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save targets'}
                    </button>
                    <button type="button" onClick={() => setEditingThemeTargets(false)} disabled={saving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {selectedThemeData.equityAllocations.map((allocation) => {
                  const draft = themeTargetDraft.find((item) => item.equityCategory === allocation.equityCategory);
                  return (
                    <label key={allocation.equityCategory} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
                      <span className="block text-xs text-slate-500">{allocation.equityCategory.replace('_', ' ')}</span>
                      {editingThemeTargets ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={draft?.percentage ?? ''}
                          onChange={(event) => setThemeTargetDraft((current) => current.map((item) => item.equityCategory === allocation.equityCategory
                            ? { ...item, percentage: event.target.value }
                            : item))}
                          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                        />
                      ) : (
                        <strong className="mt-1 block text-lg text-white">{allocation.percentage}%</strong>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {selectedThemeData ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">Theme details and asset allocation</h3>
                  <p className="mt-1 text-sm text-slate-400">Edit the selected theme master data. Asset-class weights must total 100%.</p>
                </div>
                {!editingThemeDefinition ? (
                  <button type="button" onClick={startEditingThemeDefinition} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200">
                    Edit theme details
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={saveThemeDefinition} disabled={saving} className="rounded-xl bg-sky-300 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save theme'}
                    </button>
                    <button type="button" onClick={() => setEditingThemeDefinition(false)} disabled={saving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {editingThemeDefinition ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-slate-300">Theme name
                    <input value={themeDefinitionDraft.label} onChange={(event) => setThemeDefinitionDraft((current) => ({ ...current, label: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
                  </label>
                  <label className="text-sm text-slate-300">Risk
                    <select value={themeDefinitionDraft.risk} onChange={(event) => setThemeDefinitionDraft((current) => ({ ...current, risk: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white">
                      {riskOptions.map((risk) => <option key={risk} value={risk}>{risk}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-300">Investment horizon
                    <select value={themeDefinitionDraft.investmentHorizon} onChange={(event) => setThemeDefinitionDraft((current) => ({ ...current, investmentHorizon: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white">
                      {horizonOptions.map((horizon) => <option key={horizon} value={horizon}>{horizon}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-300 md:col-span-2">Description
                    <textarea value={themeDefinitionDraft.description} onChange={(event) => setThemeDefinitionDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
                  </label>
                  {themeDefinitionDraft.allocations.map((allocation) => (
                    <label key={allocation.assetClass} className="text-sm text-slate-300">{formatAssetClass(allocation.assetClass, assetClassMetadata)} %
                      <input type="number" min="0" max="100" step="0.01" value={allocation.percentage} onChange={(event) => setThemeDefinitionDraft((current) => ({
                        ...current,
                        allocations: current.allocations.map((item) => item.assetClass === allocation.assetClass
                          ? { ...item, percentage: event.target.value }
                          : item)
                      }))} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4">
            <p className="text-sm text-slate-300">
              {selectedThemeData ? `Ready to continue with ${selectedThemeData.label}.` : 'Choose a theme to continue.'}
            </p>
            <button
              type="button"
              onClick={handleThemeNext}
              disabled={saving || !selectedTheme}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-300 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving theme...' : 'Continue with this theme'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setCurrentStep(0)} className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-200">
              Previous
            </button>
          </div>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="rounded-[32px] border border-slate-800 bg-slate-900/60 p-6">
          {selectedThemeData ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-brand-500/30 bg-brand-500/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-100">Selected theme</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedThemeData.label}</h3>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  {selectedThemeData.description || 'Allocate the portfolio across the target asset classes before adding holdings.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="info">{selectedThemeData.risk}</Badge>
                  <Badge tone="success">{selectedThemeData.investmentHorizon}</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedThemeData.allocations.map((allocation) => (
                    <div key={allocation.assetClass} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500" title={assetClassMetadata[allocation.assetClass]?.assetDescription}>
                        {formatAssetClass(allocation.assetClass, assetClassMetadata)}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">{allocation.percentage}%</p>
                    </div>
                  ))}
                </div>
                {selectedThemeData.equityAllocations?.length ? (
                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Equity category targets</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {selectedThemeData.equityAllocations.map((allocation) => (
                        <div key={allocation.equityCategory} className="rounded-xl border border-slate-800 px-3 py-2">
                          <p className="text-xs text-slate-500">{allocation.equityCategory.replace('_', ' ')}</p>
                          <p className="mt-1 text-lg font-semibold text-white">{allocation.percentage}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-sm text-slate-300">
                  Your theme is attached. Continue to Holdings to add securities and build the portfolio against these target allocations.
                </p>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setCurrentStep(1)} className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-200">
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/portfolios/${createdPortfolioId}/holdings`)}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
                >
                  Go to Holdings
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-300">No theme selected.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
