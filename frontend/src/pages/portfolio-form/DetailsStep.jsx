import { Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { money } from '../../lib/format';
import { localDateString } from '../../lib/utils';

const TYPES = [{ value: 'WEIGHTAGE', label: 'Percentage' }, { value: 'AMOUNT', label: 'Rupee amount' }];
const BENCHMARKS = ['NIFTY50', 'NASDAQ', 'SMP500'];
const REBALANCE = [{ value: 'DAILY', label: 'Daily' }, { value: 'WEEKLY', label: 'Weekly' }, { value: 'MONTHLY', label: 'Monthly' }];

function Select({ label, value, onChange, options, hint }) {
  return (
    <label className="block"><span className="field-label">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function DetailsStep({ form, update, isEditing, saving, ready, onSubmit }) {
  return (
    <Card className="p-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <label className="block md:col-span-2 xl:col-span-1"><span className="field-label">Portfolio name</span>
          <input className="field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Example: Growth Plus" /></label>
        <label className="block"><span className="field-label">Amount to invest</span>
          <input className="field" type="number" min="0" value={form.amount} onChange={(e) => update('amount', Number(e.target.value))} />
          <span className="mt-1 block text-xs text-muted-foreground">{money(form.amount, form.currency, 0)}</span></label>
        <label className="block"><span className="field-label">Purchase date</span>
          <input className="field" type="date" value={form.purchaseDate} max={localDateString()} disabled={isEditing} onChange={(e) => update('purchaseDate', e.target.value)} />
          <span className="mt-1 block text-xs text-muted-foreground">Prices on this date become your purchase prices.</span></label>
        <Select label="Allocation by" value={form.type} onChange={(v) => update('type', v)} options={TYPES} />
        <Select label="Currency" value={form.currency} onChange={(v) => update('currency', v)} options={['INR', 'USD', 'GBP']} />
        <Select label="Exchange" value={form.exchange} onChange={(v) => update('exchange', v)} options={['NSE', 'BSE']} />
        <Select label="Benchmark" value={form.benchmark} onChange={(v) => update('benchmark', v)} options={BENCHMARKS} />
        <Select label="Rebalance frequency" value={form.rebalanceFrequency} onChange={(v) => update('rebalanceFrequency', v)} options={REBALANCE} />
      </div>
      <div className="mt-7 flex justify-end">
        <Button onClick={onSubmit} disabled={saving || !form.name.trim() || !ready}>
          <Check />{saving ? 'Saving…' : isEditing ? 'Update portfolio' : 'Save and choose theme'}
        </Button>
      </div>
    </Card>
  );
}
