import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function HoldingsPageHeader({ portfolioId, loading, saving, onSave }) {
  return (
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
        <Button className="gap-2" onClick={onSave} disabled={!portfolioId || loading || saving}>
          <Save className="h-4 w-4" />
          Save holdings
        </Button>
      </div>
    </div>
  );
}