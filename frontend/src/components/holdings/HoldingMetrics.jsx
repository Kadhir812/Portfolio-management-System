import { Card } from '../ui/card';

export function HoldingMetrics({ summary, portfolio }) {
  const residualCash = Math.max(Number(portfolio?.amount || 0) - Number(summary.totalValue || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Holdings count</p>
        <p className="mt-2 text-2xl font-bold">{summary.holdingCount}</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Residual cash</p>
        <p className="mt-2 text-2xl font-bold text-emerald-600">₹{residualCash.toLocaleString('en-IN')}</p>
        <p className="mt-1 text-xs text-muted-foreground">Uninvested remainder available after price rounding</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total value</p>
        <p className="mt-2 text-2xl font-bold">₹{Number(summary.totalValue || 0).toLocaleString('en-IN')}</p>
      </Card>
    </div>
  );
}
