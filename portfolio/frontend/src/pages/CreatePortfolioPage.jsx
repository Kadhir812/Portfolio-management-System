import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { api } from '../lib/api';
import { themeLibrary } from '../data/seed';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';

const steps = ['Portfolio Setup', 'Theme Selection', 'Asset Allocation'];

const typeOptions = ['PERCENTAGE', 'RUPEE'];
const currencyOptions = ['INR', 'USD', 'GBP'];
const exchangeOptions = ['NSE', 'BSE'];
const rebalanceOptions = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];
const benchmarkOptions = ['NIFTY50', 'NASDAQ', 'SMP500'];

export function CreatePortfolioPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    type: 'RUPEE',
    currency: 'INR',
    benchmark: 'NIFTY50',
    exchange: 'NSE',
    rebalanceFrequency: 'MONTHLY',
    amount: 100000
  });
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [createdPortfolioId, setCreatedPortfolioId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedThemeData = useMemo(
    () => themeLibrary.find((item) => item.theme === selectedTheme) || null,
    [selectedTheme]
  );

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleCreateBasePortfolio = async () => {
    try {
      setSaving(true);
      setError('');
      const created = await api.portfolios.create({
        ...form,
        amount: Number(form.amount)
      });
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
        title="Create portfolio"
        description="Define the portfolio, choose the best-matching theme, and finalize allocation."
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
                      <option key={option} value={option}>{option}</option>
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
              disabled={saving || !form.name.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save portfolio
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-6">
          <div className="grid gap-5 xl:grid-cols-2">
            {themeLibrary.map((theme) => (
              <button
                key={theme.theme}
                type="button"
                onClick={() => setSelectedTheme(theme.theme)}
                className={`rounded-[28px] border p-5 text-left transition ${
                  selectedTheme === theme.theme
                    ? 'border-brand-500 bg-brand-500/10 shadow-soft'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{theme.label}</h3>
                    <p className="text-sm text-slate-400">{theme.investmentHorizon}</p>
                  </div>
                  <Badge tone="info">{theme.risk}</Badge>
                </div>

                <div className="mt-4 space-y-2">
                  {theme.allocations.map((allocation) => (
                    <div key={allocation.assetClass} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
                      <span>{allocation.assetClass.replace('_', ' ')}</span>
                      <span className="font-medium text-white">{allocation.percentage}%</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setCurrentStep(0)} className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-200">
              Previous
            </button>
            <button type="button" onClick={handleThemeNext} disabled={saving || !selectedTheme} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
              Next step
              <ArrowRight className="h-4 w-4" />
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="info">{selectedThemeData.risk}</Badge>
                  <Badge tone="success">{selectedThemeData.investmentHorizon}</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedThemeData.allocations.map((allocation) => (
                    <div key={allocation.assetClass} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{allocation.assetClass.replace('_', ' ')}</p>
                      <p className="mt-2 text-xl font-semibold text-white">{allocation.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-sm text-slate-300">Asset allocation stage is ready for the selected theme. The next step would allow you to add holdings and validate guardrails against the configured percentages.</p>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setCurrentStep(1)} className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-200">
                  Previous
                </button>
                <button type="button" onClick={() => navigate('/portfolios')} className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950">
                  Finish setup
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
