import { Info } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

/** Small metric card: label, one big value, one line of context. `hint` shows on hover of the info icon. */
export function StatTile({ label, value, sub, tone, hint, className }) {
  const toneClass = tone === 'pos' ? 'text-pos' : tone === 'neg' ? 'text-neg' : tone === 'warn' ? 'text-warn' : '';
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        {hint ? <span title={hint} className="text-muted-foreground/60 hover:text-muted-foreground"><Info className="h-3.5 w-3.5" /></span> : null}
      </div>
      <p className={cn('mt-2 truncate text-2xl font-bold tracking-tight', toneClass)}>{value}</p>
      {sub ? <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}
