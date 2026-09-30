import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function AllocationSummary({ targetAmount, allocationSummary, allocationMatches, formatAssetClass }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme allocation targets</CardTitle>
        <p className="text-sm text-muted-foreground">
          Target amounts are based on the portfolio investment of ₹{targetAmount.toLocaleString('en-IN')}. Uninvested money is counted as cash.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Asset class</th>
                <th className="px-3 py-3 font-medium">Target</th>
                <th className="px-3 py-3 font-medium">Current</th>
                <th className="px-3 py-3 font-medium">Difference</th>
                <th className="px-3 py-3 font-medium">Required amount</th>
              </tr>
            </thead>
            <tbody>
              {allocationSummary.map((allocation) => (
                <tr key={allocation.assetClass} className="border-t border-border">
                  <td className="px-3 py-3 font-medium">{formatAssetClass(allocation.assetClass)}</td>
                  <td className="px-3 py-3">{allocation.targetPercentage.toFixed(2)}%</td>
                  <td className="px-3 py-3">{allocation.currentPercentage.toFixed(2)}%</td>
                  <td className={`px-3 py-3 font-medium ${Math.abs(allocation.difference) <= 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {allocation.difference >= 0 ? '+' : ''}{allocation.difference.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3">₹{allocation.requiredAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-sm ${allocationMatches ? 'text-emerald-600' : 'text-amber-600'}`}>
          {allocationMatches
            ? 'All theme allocation targets currently match.'
            : 'These are target allocations; you can save holdings before every target is fully allocated. Uninvested money is counted as cash.'}
        </p>
      </CardContent>
    </Card>
  );
}