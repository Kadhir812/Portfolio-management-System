import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-foreground',
        outline: 'border-border text-muted-foreground',
        info: 'border-transparent bg-primary/15 text-primary',
        success: 'border-transparent bg-pos/15 text-pos',
        warning: 'border-transparent bg-warn/15 text-warn',
        danger: 'border-transparent bg-neg/15 text-neg'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
