import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Stepper({ steps, current }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-3">
          <span className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold',
            index < current && 'border-primary bg-primary text-primary-foreground',
            index === current && 'border-primary text-primary',
            index > current && 'border-border text-muted-foreground'
          )}>
            {index < current ? <Check className="h-3.5 w-3.5" /> : index + 1}
          </span>
          <span className={cn('text-sm font-medium', index > current && 'text-muted-foreground')}>{step}</span>
          {index < steps.length - 1 && <span className="h-px w-8 bg-border" />}
        </li>
      ))}
    </ol>
  );
}
