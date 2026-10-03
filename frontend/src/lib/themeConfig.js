export const riskOptions = ['Low', 'Moderate', 'High', 'Very High'];
export const horizonOptions = ['Short Term', 'Medium Term', 'Long Term'];
export const percentageMatches = (value, target) => Math.abs(value - target) < 0.0001;

export const themePayload = (definition, equityAllocations) => ({
  ...definition,
  allocations: definition.allocations.map((allocation) => ({
    assetClass: allocation.assetClass,
    percentage: Number(allocation.percentage)
  })),
  equityAllocations: equityAllocations.map((allocation) => ({
    equityCategory: allocation.equityCategory,
    percentage: Number(allocation.percentage)
  }))
});

export const validateThemeDraft = (definition, equityAllocations) => {
  if (!definition?.label?.trim() || !definition?.risk?.trim() || !definition?.investmentHorizon?.trim()) {
    return 'Theme name, risk, and investment horizon are required.';
  }

  const assetTotal = definition.allocations.reduce(
    (sum, allocation) => sum + Number(allocation.percentage || 0), 0
  );
  if (!percentageMatches(assetTotal, 100)) {
    return 'Asset class allocations must total 100%.';
  }

  if (definition.allocations.some((allocation) => (
    !allocation.assetClass
    || allocation.percentage === ''
    || Number(allocation.percentage) < 0
    || Number(allocation.percentage) > 100
  ))) {
    return 'Asset class percentages must be between 0 and 100.';
  }

  const equityTarget = Number(
    definition.allocations.find((allocation) => allocation.assetClass === 'EQUITY')?.percentage || 0
  );
  const equityTotal = equityAllocations.reduce(
    (sum, allocation) => sum + Number(allocation.percentage || 0), 0
  );
  if (equityAllocations.length !== 3 || new Set(equityAllocations.map((allocation) => allocation.equityCategory)).size !== 3) {
    return 'Exactly three unique equity categories are required.';
  }
  if (equityAllocations.some((allocation) => (
    !allocation.equityCategory
    || allocation.percentage === ''
    || Number(allocation.percentage) < 0
    || Number(allocation.percentage) > 100
  ))) {
    return 'Equity category percentages must be between 0 and 100.';
  }
  if (!percentageMatches(equityTotal, equityTarget)) {
    return `Equity category targets must total ${equityTarget}%.`;
  }
  return '';
};
