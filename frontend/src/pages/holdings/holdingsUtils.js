import { localDateString } from '../../lib/utils';

export const eligiblePriceDate = (portfolio) => portfolio.holdingsSaved
  ? localDateString()
  : portfolio.purchaseDate || localDateString();

export { formatAssetClass } from '../../lib/assetClassUtils';