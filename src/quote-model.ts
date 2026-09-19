

/** HELIO prototype: transparent assumptions, not an engineering or tariff engine. */
export interface QuoteInput {
  mode: 'consumption' | 'bill';
  period: 'monthly' | 'bimonthly';
  amount: number;
  tariff: number;
  roofArea: number;
  nonEnergyPercent: number;
  location: 'cdmx' | 'metro';
}

export const DEFAULT_QUOTE_INPUT: QuoteInput = {
  mode: 'consumption', period: 'bimonthly', amount: 1000,
  tariff: 4, roofArea: 40, nonEnergyPercent: 10, location: 'cdmx',
};

export const QUOTE_ASSUMPTIONS = Object.freeze({
  panelKw: 0.585, areaPerPanel: 3.2,
  yieldLow: 1350, yieldHigh: 1650, sizingYield: 1500,
  targetCoverage: 0.9, valueFactorLow: 0.85, valueFactorHigh: 0.95,
  priceBaseLow: 14000, priceBaseHigh: 18000,
  pricePerKwLow: 22000, pricePerKwHigh: 28000,
});

export const QUOTE_SOURCES = [
  { title: 'CFE · Contratos de interconexión', url: 'https://www.cfe.gob.mx/industria/nuevocontrato/Pages/contratos-de-interonexion.aspx' },
  { title: 'Global Solar Atlas · Metodología y unidades', url: 'https://globalsolaratlas.info/support/faq' },
  { title: 'PVWatts · Modelación fotovoltaica', url: 'https://pvwatts.nlr.gov/pvwatts.php' },
] as const;

export interface QuoteResult {
  annualConsumption: number;
  annualEnergyCost: number;
  panelCount: number;
  targetPanels: number;
  roofLimited: boolean;
  capacityKw: number;
  areaRequired: number;
  productionLow: number;
  productionHigh: number;
  savingsLow: number;
  savingsHigh: number;
  coverageLow: number;
  coverageHigh: number;
  priceLow: number;
  priceHigh: number;
}

function assertRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${label}: ingresa un valor entre ${min} y ${max}.`);
  }
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  if (!['consumption', 'bill'].includes(input.mode) || !['monthly', 'bimonthly'].includes(input.period) || !['cdmx', 'metro'].includes(input.location)) {
    throw new RangeError('Selecciona opciones válidas para tu escenario.');
  }
  assertRange(input.amount, 0, input.mode === 'bill' ? 200000 : 50000, 'Consumo o importe');
  assertRange(input.tariff, 0.1, 20, 'Costo equivalente');
  assertRange(input.roofArea, 0, 500, 'Superficie');
  assertRange(input.nonEnergyPercent, 0, 100, 'Cargos no compensables');
  const a = QUOTE_ASSUMPTIONS;
  const periods = input.period === 'monthly' ? 12 : 6;
  const energyAmount = input.mode === 'bill' ? input.amount * (1 - input.nonEnergyPercent / 100) / input.tariff : input.amount;
  const annualConsumption = energyAmount * periods;
  const annualEnergyCost = annualConsumption * input.tariff;
  const targetPanels = Math.ceil(annualConsumption * a.targetCoverage / (a.panelKw * a.sizingYield));
  const panelCount = Math.min(targetPanels, Math.floor((input.roofArea + 1e-9) / a.areaPerPanel));
  const capacityKw = panelCount * a.panelKw;
  const productionLow = capacityKw * a.yieldLow;
  const productionHigh = capacityKw * a.yieldHigh;
  // Only the energy portion is valued. No income is assigned to annual surplus.
  const savingsLow = Math.min(productionLow, annualConsumption) * input.tariff * a.valueFactorLow;
  const savingsHigh = Math.min(productionHigh, annualConsumption) * input.tariff * a.valueFactorHigh;
  return {
    annualConsumption, annualEnergyCost, panelCount, targetPanels,
    roofLimited: panelCount < targetPanels, capacityKw,
    areaRequired: panelCount * a.areaPerPanel, productionLow, productionHigh,
    savingsLow, savingsHigh,
    coverageLow: annualConsumption > 0 ? Math.min(100, productionLow / annualConsumption * 100) : 0,
    coverageHigh: annualConsumption > 0 ? Math.min(100, productionHigh / annualConsumption * 100) : 0,
    priceLow: panelCount ? a.priceBaseLow + capacityKw * a.pricePerKwLow : 0,
    priceHigh: panelCount ? a.priceBaseHigh + capacityKw * a.pricePerKwHigh : 0,
  };
}

