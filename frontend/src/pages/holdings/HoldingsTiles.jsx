import { StatTile } from '../../components/StatTile';
import { money, trimPct } from '../../lib/format';

export function HoldingsTiles({ model, holdingCount, currency }) {
  const onTarget = model.classRows.filter((row) => Math.abs(row.gapPct) <= 0.5).length;
  const investedPct = model.amount > 0 ? (model.invested / model.amount) * 100 : 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatTile label="Investment" value={money(model.amount, currency, 0)} sub="Amount to invest" />
      <StatTile label="Invested" value={money(model.invested, currency, 0)} sub={`${trimPct(investedPct)} of investment`} />
      <StatTile label="Available cash" value={money(model.availableCash, currency, 0)} tone="pos" sub="Left to spend" hint="Investment amount minus the value of the holdings you have added." />
      <StatTile label="Holdings" value={holdingCount} sub="Securities added" />
      <StatTile
        label="Asset classes on target"
        value={model.classRows.length ? `${onTarget} of ${model.classRows.length}` : '—'}
        sub="Within 0.5 pp of the theme"
        hint="Holdings can be saved before every target is met. Unspent money counts as cash."
      />
    </div>
  );
}
