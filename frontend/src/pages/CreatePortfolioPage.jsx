import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { assetClassMap } from '../lib/assetClassUtils';
import { localDateString } from '../lib/utils';
import { DetailsStep } from './portfolio-form/DetailsStep';
import { Stepper } from './portfolio-form/Stepper';
import { ThemeStep } from './portfolio-form/ThemeStep';

const STEPS = ['Portfolio details', 'Theme'];
const EMPTY = {
  name: '', type: 'AMOUNT', currency: 'INR', benchmark: 'NIFTY50', exchange: 'NSE',
  rebalanceFrequency: 'MONTHLY', amount: 100000, purchaseDate: localDateString(), status: 'NEW'
};

/** Two steps: portfolio details, then theme. Holdings are added on their own page afterwards. */
export function CreatePortfolioPage() {
  const navigate = useNavigate();
  const { id: editingId } = useParams();
  const isEditing = Boolean(editingId);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [portfolioId, setPortfolioId] = useState(editingId ? Number(editingId) : null);
  const [holdingsSaved, setHoldingsSaved] = useState(false);
  const [themes, setThemes] = useState([]);
  const [meta, setMeta] = useState({});
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [ready, setReady] = useState(!isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.themes.list(), api.assetClasses.list()])
      .then(([themeData, assetClasses]) => { setThemes(themeData); setMeta(assetClassMap(assetClasses)); })
      .catch((e) => setError(e.message || 'Unable to load themes'))
      .finally(() => setLoadingThemes(false));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    api.portfolios.get(editingId)
      .then((p) => {
        setForm({
          name: p.name || '', type: p.type || 'AMOUNT', currency: p.currency || 'INR', benchmark: p.benchmark || 'NIFTY50',
          exchange: p.exchange || 'NSE', rebalanceFrequency: p.rebalanceFrequency || 'MONTHLY', amount: p.amount || 0,
          purchaseDate: p.purchaseDate || localDateString(), status: p.status || (p.holdingsSaved ? 'ACTIVE' : 'NEW')
        });
        setSelectedTheme(p.theme || null);
        setHoldingsSaved(Boolean(p.holdingsSaved));
      })
      .catch((e) => setError(e.message || 'Unable to load portfolio'))
      .finally(() => setReady(true));
  }, [editingId]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveDetails = async () => {
    try {
      setSaving(true);
      setError('');
      const payload = { ...form, amount: Number(form.amount) };
      if (isEditing) {
        await api.portfolios.update(editingId, payload);
        if (holdingsSaved && selectedTheme) { navigate(`/portfolios/${editingId}`); return; }
      } else if (!portfolioId) {
        setPortfolioId((await api.portfolios.create(payload)).id);
      } else {
        await api.portfolios.update(portfolioId, payload);
      }
      setStep(1);
    } catch (e) {
      setError(e.message || 'Unable to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const attachTheme = async () => {
    try {
      setSaving(true);
      setError('');
      await api.themes.attach(portfolioId, selectedTheme);
      navigate(`/portfolios/${portfolioId}/holdings`);
    } catch (e) {
      setError(e.message || 'Unable to attach the theme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isEditing ? 'Edit portfolio' : 'Create portfolio'}
        description={isEditing ? 'Update the settings. Your theme and holdings are kept.' : 'Set up the portfolio, then pick the theme it should follow.'}
        back={<Link to="/portfolios" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Portfolios</Link>}
      />
      <Stepper steps={STEPS} current={step} />
      <Notice tone="error">{error}</Notice>

      {step === 0 && <DetailsStep form={form} update={update} isEditing={isEditing} saving={saving} ready={ready} onSubmit={saveDetails} />}
      {step === 1 && (
        <ThemeStep
          themes={themes}
          loading={loadingThemes}
          meta={meta}
          selected={selectedTheme}
          onSelect={setSelectedTheme}
          onThemeSaved={(updated) => setThemes((list) => list.map((t) => (t.theme === updated.theme ? updated : t)))}
          saving={saving}
          onBack={() => setStep(0)}
          onNext={attachTheme}
        />
      )}
    </>
  );
}
