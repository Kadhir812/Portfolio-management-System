export const assetClassMap = (records = []) => records.reduce((map, record) => {
  if (!map[record.assetClass]) {
    map[record.assetClass] = record;
  }
  return map;
}, {});

const labels = {
  EQUITY: 'Equity',
  MUTUAL_FUNDS: 'Mutual Funds',
  COMMODITIES: 'Commodities',
  BONDS: 'Bonds',
  CRYPTO: 'Crypto',
  REITS: 'REITs',
  ETFS: 'ETFs',
  CASH: 'Cash'
};

export const formatAssetClass = (assetClass) => (
  labels[assetClass]
  || (assetClass || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
);

export const formatSubAssetClass = (assetClass, subAssetClass) => (
  subAssetClass
  || (assetClass === 'EQUITY' ? 'Stocks' : '—')
);
