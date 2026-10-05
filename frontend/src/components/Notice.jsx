import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const TONES = {
  error: { box: 'border-neg/30 bg-neg/10 text-neg', Icon: XCircle },
  warning: { box: 'border-warn/30 bg-warn/10 text-warn', Icon: AlertTriangle },
  success: { box: 'border-pos/30 bg-pos/10 text-pos', Icon: CheckCircle2 },
  info: { box: 'border-primary/30 bg-primary/10 text-primary', Icon: Info }
};

/** One inline message style for errors, warnings and confirmations. Renders nothing when empty. */
export function Notice({ tone = 'info', children, className }) {
  if (!children) return null;
  const { box, Icon } = TONES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
