import { localDateString } from '../../lib/utils';

export const eligiblePriceDate = (portfolio) => portfolio.holdingsSaved
  ? localDateString()
  : portfolio.purchaseDate || localDateString();

export const formatAssetClass = (assetClass) => assetClass === 'STOCKS'
  ? 'Equity'
  : assetClass.replaceAll('_', ' ');