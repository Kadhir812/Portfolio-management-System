export const samplePortfolios = [
  {
    id: 'p-101',
    name: 'Retirement Growth',
    theme: 'CONSERVATIVE',
    risk: 'Moderate',
    horizon: 'Medium Term',
    amount: 250000,
    currency: 'INR',
    status: 'active',
    benchmark: 'NIFTY50',
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'p-102',
    name: 'Wealth Builder',
    theme: 'AGGRESSIVE',
    risk: 'High',
    horizon: 'Long Term',
    amount: 550000,
    currency: 'INR',
    status: 'new',
    benchmark: 'NIFTY50',
    createdAt: '2025-02-20T00:00:00Z'
  }
];

export const themeLibrary = [
  { theme: 'CONSERVATIVE', label: 'Conservative', risk: 'Moderate', investmentHorizon: 'Medium Term', allocations: [
    { assetClass: 'STOCKS', percentage: 15 },
    { assetClass: 'MUTUAL_FUNDS', percentage: 25 },
    { assetClass: 'COMMODITIES', percentage: 10 },
    { assetClass: 'BONDS', percentage: 35 },
    { assetClass: 'REITS', percentage: 5 },
    { assetClass: 'ETFS', percentage: 5 },
    { assetClass: 'CASH', percentage: 5 }
  ] },
  { theme: 'MODERATELY_CONSERVATIVE', label: 'Moderately Conservative', risk: 'Low', investmentHorizon: 'Short Term', allocations: [
    { assetClass: 'STOCKS', percentage: 25 },
    { assetClass: 'MUTUAL_FUNDS', percentage: 25 },
    { assetClass: 'COMMODITIES', percentage: 10 },
    { assetClass: 'BONDS', percentage: 25 },
    { assetClass: 'REITS', percentage: 5 },
    { assetClass: 'ETFS', percentage: 5 },
    { assetClass: 'CASH', percentage: 5 }
  ] },
  { theme: 'AGGRESSIVE', label: 'Aggressive', risk: 'High', investmentHorizon: 'Long Term', allocations: [
    { assetClass: 'STOCKS', percentage: 45 },
    { assetClass: 'MUTUAL_FUNDS', percentage: 15 },
    { assetClass: 'COMMODITIES', percentage: 5 },
    { assetClass: 'BONDS', percentage: 10 },
    { assetClass: 'CRYPTO', percentage: 10 },
    { assetClass: 'REITS', percentage: 5 },
    { assetClass: 'ETFS', percentage: 5 },
    { assetClass: 'CASH', percentage: 5 }
  ] },
  { theme: 'MODERATELY_AGGRESSIVE', label: 'Moderately Aggressive', risk: 'High', investmentHorizon: 'Long Term', allocations: [
    { assetClass: 'STOCKS', percentage: 55 },
    { assetClass: 'MUTUAL_FUNDS', percentage: 10 },
    { assetClass: 'COMMODITIES', percentage: 5 },
    { assetClass: 'BONDS', percentage: 5 },
    { assetClass: 'CRYPTO', percentage: 10 },
    { assetClass: 'REITS', percentage: 5 },
    { assetClass: 'ETFS', percentage: 5 },
    { assetClass: 'CASH', percentage: 5 }
  ] },
  { theme: 'VERY_AGGRESSIVE', label: 'Very Aggressive', risk: 'Very High', investmentHorizon: 'Long Term', allocations: [
    { assetClass: 'STOCKS', percentage: 85 },
    { assetClass: 'BONDS', percentage: 10 },
    { assetClass: 'CASH', percentage: 5 }
  ] }
];
