import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button, buttonVariants } from '../../components/ui/button';

export function HoldingsHeader({ portfolio, theme, busy, onSave }) {
  return (
    <PageHeader
      title="Holdings"
      description={portfolio ? `Choose securities for ${portfolio.name}. Limits come from the ${theme?.label || 'selected'} theme.` : undefined}
      back={(
        <Link to="/portfolios" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Portfolios
        </Link>
      )}
    >
      {theme?.label && <Badge variant="info">{theme.label}</Badge>}
      <Button onClick={onSave} disabled={!portfolio || busy}>
        <Check /> {portfolio?.holdingsSaved ? 'Done' : 'Save holdings'}
      </Button>
    </PageHeader>
  );
}
