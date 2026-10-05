// Rebalance proposal: sell overweight classes and buy underweight classes.
export function buildRebalanceOrders(valuation, eligibleSecurities = []) {
  const orders = [];
  const valueByClass = new Map();
  valuation.holdings.forEach((holding) => {
    valueByClass.set(holding.assetClass, (valueByClass.get(holding.assetClass) || 0) + Number(holding.value));
  });

  const total = Number(valuation.totalValue);
  const invested = valuation.holdings.reduce((sum, holding) => sum + Number(holding.value), 0);
  let availableCash = Math.max(total - invested, 0);

  valuation.allocations.forEach((allocation) => {
    if (Number(allocation.driftPercentagePoints) <= 0) return;
    const classValue = valueByClass.get(allocation.assetClass) || 0;
    if (!classValue) return;

    const valueDelta = (total * Number(allocation.targetPercentage)) / 100 - classValue;
    if (valueDelta >= 0) return;
    availableCash -= valueDelta;

    // Spread each sale across the class's holdings in proportion to size.
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
          signedShares,
          action: 'SELL'
        });
      }
    });
  });

  valuation.allocations.forEach((allocation) => {
    if (Number(allocation.driftPercentagePoints) >= 0 || availableCash <= 0) return;
    const classValue = valueByClass.get(allocation.assetClass) || 0;
    const targetValue = total * Number(allocation.targetPercentage) / 100;
    const buyValue = Math.min(targetValue - classValue, availableCash);
    if (buyValue <= 0) return;

    const holding = valuation.holdings.find((row) => row.assetClass === allocation.assetClass);
    const candidate = holding || eligibleSecurities.find((row) => row.assetClass === allocation.assetClass);
    const candidatePrice = candidate?.currentPrice ?? candidate?.latestPrice;
    if (!candidate || Number(candidatePrice) <= 0) return;

    const unitPrice = Number(candidatePrice);
    orders.push({
      securityId: candidate.securityId,
      isin: candidate.isin,
      symbol: candidate.symbol,
      assetClass: candidate.assetClass,
      unitPrice,
      heldShares: holding ? Number(holding.shares) : 0,
      signedShares: buyValue / unitPrice,
      targetValue: buyValue,
      candidates: eligibleSecurities.filter((row) => row.assetClass === allocation.assetClass),
      action: 'BUY'
    });
    availableCash -= buyValue;
  });

  return orders;
}

export const buildSellOrders = buildRebalanceOrders;

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
  let purchaseValue = 0;
  orders.forEach((order) => {
    const tradeValue = order.signedShares * order.unitPrice;
    orderTotal += tradeValue;
    valueByClass.set(order.assetClass, (valueByClass.get(order.assetClass) || 0) + tradeValue);
    if (tradeValue < 0) sellValue -= tradeValue;
    if (tradeValue > 0) purchaseValue += tradeValue;
  });

  // Sells add proceeds to cash; purchases consume cash.
  const projectedInvested = invested - sellValue + purchaseValue;
  const projectedCash = cash + sellValue - purchaseValue;
  valueByClass.set('CASH', projectedCash);
  const projectedTotal = projectedInvested + projectedCash;

  return {
    cashBefore: cash,
    sellValue,
    purchaseValue,
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
