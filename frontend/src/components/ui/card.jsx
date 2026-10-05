import * as React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('min-w-0 rounded-xl border border-border bg-card text-card-foreground', className)} {...props} />
));
Card.displayName = 'Card';

export { Card };
