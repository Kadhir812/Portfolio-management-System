// Rebalance proposal: sell from classes that are more than 5 pp overweight, then project the result.

export function buildSellOrders(valuation) {
  const orders = [];
  const valueByClass = new Map();
  valuation.holdings.forEach((holding) => {
    valueByClass.set(holding.assetClass, (valueByClass.get(holding.assetClass) || 0) + Number(holding.value));
  });

  valuation.allocations.forEach((allocation) => {
    if (Number(allocation.driftPercentagePoints) <= 5) return;
    const classValue = valueByClass.get(allocation.assetClass) || 0;
    if (!classValue) return;

    const valueDelta = (Number(valuation.totalValue) * Number(allocation.targetPercentage)) / 100 - classValue;
    if (valueDelta >= 0) return;

    // spread the sale across the class's holdings in proportion to their size
    valuation.holdings.filter((holding) => holding.assetClass === allocation.assetClass).forEach((holding) => {
      const signedShares = (valueDelta * Number(holding.value)) / classValue / Number(holding.currentPrice);
      if (Math.abs(signedShares) > 0.000001) {
        orders.push({
          securityId: holding.securityId,
          isin: holding.isin,
          symbol: holding.symbol,
          assetClass: holding.assetClass,
          unitPrice: Number(holding.currentPrice),
          heldShares: Number(holding.shares),
          signedShares
        });
      }
    });
  });
  return orders;
}

export function projectRebalance(valuation, orders, portfolioAmount) {
  const total = Number(valuation.totalValue);
  const valueByClass = new Map();
  let invested = 0;
  valuation.holdings.forEach((holding) => {
    const value = Number(holding.value);
    invested += value;
    valueByClass.set(holding.assetClass, (valueByClass.get(holding.assetClass) || 0) + value);
  });

  const cash = Math.max(total - invested, 0);
  valueByClass.set('CASH', cash);
  const currentByClass = new Map(valueByClass);

  let orderTotal = 0;
  let sellValue = 0;
  orders.forEach((order) => {
    const tradeValue = order.signedShares * order.unitPrice;
    orderTotal += tradeValue;
    valueByClass.set(order.assetClass, (valueByClass.get(order.assetClass) || 0) + tradeValue);
    if (tradeValue < 0) sellValue -= tradeValue;
  });

  const projectedInvested = invested + orderTotal;
  const projectedCash = cash - orderTotal;
  valueByClass.set('CASH', projectedCash);
  const projectedTotal = projectedInvested + projectedCash;

  return {
    sellValue,
    projectedInvested,
    projectedCash,
    projectedTotal,
    allocations: valuation.allocations.map((allocation) => {
      const targetPct = Number(allocation.targetPercentage);
      const currentValue = currentByClass.get(allocation.assetClass) || 0;
      const projectedValue = valueByClass.get(allocation.assetClass) || 0;
      const projectedPct = projectedTotal > 0 ? (projectedValue / projectedTotal) * 100 : 0;
      return {
        assetClass: allocation.assetClass,
        targetPct,
        currentPct: Number(allocation.currentPercentage),
        currentValue,
        initialTarget: (portfolioAmount * targetPct) / 100,
        addValue: Math.max((total * targetPct) / 100 - currentValue, 0),
        projectedValue,
        projectedPct,
        driftNow: Number(allocation.currentPercentage) - targetPct,
        driftAfter: projectedPct - targetPct
      };
    })
  };
}
