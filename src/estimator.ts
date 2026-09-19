import './estimator.css';
import { calculateQuote, DEFAULT_QUOTE_INPUT, QUOTE_ASSUMPTIONS, QUOTE_SOURCES, type QuoteInput } from './quote-model';
export { calculateQuote, DEFAULT_QUOTE_INPUT, QUOTE_ASSUMPTIONS, QUOTE_SOURCES } from './quote-model';
const number = (value: number, digits = 0) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: digits }).format(value);
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Math.round(value));
const currencyRange = (low: number, high: number) => `${money(low)} - ${money(high)}`;
const locationName = (input: QuoteInput) => input.location === 'cdmx' ? 'Ciudad de México' : 'Área metropolitana';

/** Dynamic import keeps the PDF library out of the first screen's JavaScript. */
export async function createQuotePdf(input: QuoteInput, issuedAt = new Date()) {
  const q = calculateQuote(input);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const green = [19, 42, 19] as const;
  const lime = [236, 243, 158] as const;
  const cream = [245, 246, 236] as const;
  const muted = [98, 120, 85] as const;
  const date = issuedAt.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  pdf.setProperties({ title: 'HELIO | Tu escenario solar', subject: 'Cotización ilustrativa de un prototipo de marca ficticia', author: 'HELIO · Prototipo', creator: 'HELIO Solar Estimator' });
  function text(content: string, x: number, y: number, size = 10, color: readonly [number, number, number] = green, bold = false) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(...color); pdf.text(content, x, y);
  }
  function paragraph(content: string, x: number, y: number, width: number, size = 9, color: readonly [number, number, number] = muted) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(size); pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(content, width) as string[];
    pdf.text(lines, x, y, { lineHeightFactor: 1.45 });
    return y + lines.length * size * 0.3528 * 1.45;
  }
  function fittedText(content: string, x: number, y: number, width: number, size: number, color: readonly [number, number, number]) {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(size);
    const adjusted = Math.min(size, size * width / Math.max(1, pdf.getTextWidth(content)));
    text(content, x, y, adjusted, color, true);
  }
  function logo(y = 20) {
    pdf.setDrawColor(...green); pdf.setLineWidth(0.7); pdf.circle(23, y - 1.5, 2.4);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      pdf.line(23 + Math.cos(angle) * 3.7, y - 1.5 + Math.sin(angle) * 3.7, 23 + Math.cos(angle) * 5.5, y - 1.5 + Math.sin(angle) * 5.5);
    }
    text('HELIO', 33, y + 1, 21, green, true);
    text('ENERGÍA PARA LO QUE VIENE', 123, y, 7.2, muted);
  }
  function footer(page: number) {
    pdf.setDrawColor(207, 215, 203); pdf.setLineWidth(0.25); pdf.line(18, 278, 192, 278);
    text('HELIO es una marca ficticia. Documento demostrativo, sin validez comercial.', 18, 284, 7, muted);
    text(`${page} / 2`, 184, 284, 7, muted);
  }
  pdf.setFillColor(...cream); pdf.rect(0, 0, 210, 297, 'F'); logo();
  text('TU ESCENARIO SOLAR', 18, 44, 8, muted, true);
  text('Un techo. Muchas posibilidades.', 18, 58, 22, green, true);
  text(`${locationName(input)}  |  ${date}`, 18, 68, 9, muted);
  pdf.setFillColor(...green); pdf.roundedRect(18, 80, 174, 57, 4, 4, 'F');
  text('AHORRO ANUAL ILUSTRATIVO EN ENERGÍA', 26, 92, 8, lime, true);
  fittedText(currencyRange(q.savingsLow, q.savingsHigh), 26, 109, 158, 25, cream);
  text('MXN / año. Excluye cargos fijos y otros conceptos no compensables.', 26, 123, 8.2, cream);
  const metrics = [
    ['PANELES DE 585 W', `${q.panelCount}`, `${number(q.capacityKw, 2)} kWp de capacidad`],
    ['GENERACIÓN ANUAL', `${number(q.productionLow)} - ${number(q.productionHigh)}`, 'kWh / año, rango supuesto'],
    ['SUPERFICIE PREVISTA', `${number(q.areaRequired, 1)} m²`, `de ${number(input.roofArea)} m² disponibles`],
  ];
  metrics.forEach(([label, value, note], index) => {
    const x = 18 + index * 59;
    text(label, x, 152, 7.4, muted, true); fittedText(value, x, 164, 53, index === 1 ? 14 : 21, green); text(note, x, 173, 7.4, muted);
  });
  pdf.setFillColor(...lime); pdf.roundedRect(18, 187, 174, 32, 3, 3, 'F');
  text('PRESUPUESTO ILUSTRATIVO', 25, 197, 7.6, green, true);
  fittedText(currencyRange(q.priceLow, q.priceHigh), 25, 211, 94, 22, green);
  text('MXN · IVA contemplado en el escenario', 124, 208, 7.3, green);
  text('EL PUNTO DE PARTIDA', 18, 232, 8, muted, true);
  const period = input.period === 'monthly' ? 'mensual' : 'bimestral';
  text(`${input.mode === 'bill' ? 'Importe' : 'Consumo'} ${period}: ${input.mode === 'bill' ? money(input.amount) : `${number(input.amount)} kWh`}`, 18, 242, 9);
  text(`Costo equivalente: ${number(input.tariff, 2)} MXN/kWh`, 108, 242, 9);
  const note = q.roofLimited
    ? `El espacio limita el escenario a ${q.panelCount} paneles; el objetivo de consumo requeriría ${q.targetPanels}. Se necesita una visita técnica.`
    : 'El resultado es orientativo. Una visita técnica y el análisis de tus recibos definirán capacidad, distribución y precio reales.';
  paragraph(note, 18, 255, 174, 8.5); footer(1);

  pdf.addPage(); pdf.setFillColor(...cream); pdf.rect(0, 0, 210, 297, 'F'); logo();
  text('SUPUESTOS A LA VISTA', 18, 44, 8, muted, true);
  text('Así llegamos a tu escenario.', 18, 58, 22, green, true);
  const a = QUOTE_ASSUMPTIONS;
  const assumptions = [
    ['01 / Consumo', `Se anualiza tu dato ${period} (${input.period === 'monthly' ? '12' : '6'} periodos): ${number(q.annualConsumption)} kWh/año. ${input.mode === 'bill' ? `Del importe se excluye ${number(input.nonEnergyPercent)}% para conceptos no energéticos; el resto se divide entre ${number(input.tariff, 2)} MXN/kWh.` : 'Se toma el consumo en kWh que capturaste. No incluye futuros consumos de un vehículo eléctrico.'}`],
    ['02 / Dimensionamiento', `Objetivo de generación: 90% del consumo anual usando 1,500 kWh/kWp/año y módulos de 585 W. Se redondea al panel siguiente y se limita por ${a.areaPerPanel} m² por panel, incluyendo un margen conceptual de acceso. La geometría y resistencia del techo no se evalúan.`],
    ['03 / Producción', 'Se asumen 1,350 - 1,650 kWh por kWp al año, con pérdidas integradas. Es un rango de diseño del prototipo, no una simulación meteorológica de tu domicilio. Sombras, orientación, clima, equipos y mantenimiento pueden cambiar el resultado. Se aplica el mismo rango a ambas zonas.'],
    ['04 / Ahorro', `Ahorro = menor entre generación y consumo anual x ${number(input.tariff, 2)} MXN/kWh x 85% - 95%. Estos factores prudentes son supuestos del prototipo. El costo equivalente no es una tarifa oficial de CFE; no modela bloques, subsidios o cambio de tarifa. No se valoran excedentes anuales ni se garantizan ahorros.`],
    ['05 / Presupuesto', 'Rango creado para demostrar el cotizador: mínimo $14,000 + $22,000 por kWp; máximo $18,000 + $28,000 por kWp, MXN con IVA contemplado. Considera conceptualmente paneles, inversor, estructura y montaje estándar. No es un precio de mercado investigado, oferta ni cotización vinculante.'],
  ];
  let y = 75;
  assumptions.forEach(([label, body]) => {
    text(label, 18, y, 9.3, green, true);
    y = paragraph(body, 18, y + 6, 174, 8.4) + 7;
  });
  text('ALCANCE Y REFERENCIAS', 18, y, 8, green, true); y += 6;
  y = paragraph('No incluye batería, cargador de auto, obra civil, refuerzo de techo, financiamiento ni adecuaciones de red. La operación con CFE depende del estudio, contrato e interconexión aplicables. Las referencias explican conceptos; no avalan los precios ni los coeficientes de este prototipo.', 18, y, 174, 8.2) + 4;
  QUOTE_SOURCES.forEach((source) => {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...green);
    pdf.textWithLink(source.title, 18, y, { url: source.url }); y += 5;
  });
  footer(2);
  return pdf;
}

export function mountEstimator(element: HTMLElement): void {
  element.classList.add('helio-estimator');
  // All markup is static; user values are only assigned through textContent/value.
  element.innerHTML = `
    <div class="estimator-layout">
      <form class="estimator-form" novalidate aria-label="Configura tu escenario solar">
        <fieldset class="estimator-mode"><legend>¿Qué dato tienes a la mano?</legend><div class="estimator-segment"><label><input type="radio" name="solar-mode" value="consumption" checked><span>Mi consumo en kWh</span></label><label><input type="radio" name="solar-mode" value="bill"><span>Mi recibo en pesos</span></label></div></fieldset>
        <div class="estimator-input-row"><div class="estimator-field"><label for="solar-amount" data-amount-label>Consumo del recibo</label><div class="estimator-number"><input id="solar-amount" name="amount" type="number" min="0" max="50000" step="1" value="1000" required inputmode="decimal" aria-describedby="solar-amount-help"><span data-amount-unit>kWh</span></div></div><div class="estimator-field estimator-period"><label for="solar-period">Periodo</label><select id="solar-period" name="period"><option value="bimonthly">Bimestral</option><option value="monthly">Mensual</option></select></div></div>
        <p id="solar-amount-help" class="estimator-help">Busca “consumo” en tu recibo. Usar kWh mejora la estimación.</p>
        <div class="estimator-field estimator-roof"><label for="solar-roof">Techo disponible <output for="solar-roof" data-roof-value>40 m²</output></label><input id="solar-roof" name="roof" type="range" min="0" max="150" step="1" value="40"><div class="estimator-range-labels"><span>0 m²</span><span>150 m²</span></div></div>
        <div class="estimator-field"><label for="solar-location">¿Dónde está tu proyecto?</label><select id="solar-location" name="location"><option value="cdmx">Ciudad de México</option><option value="metro">Área metropolitana</option></select></div>
        <details class="estimator-assumptions"><summary>Ajustar supuestos <span class="material-symbol expand-icon" aria-hidden="true">add</span></summary><div class="estimator-assumptions-content"><div class="estimator-field"><label for="solar-tariff">Costo equivalente por kWh (MXN)</label><input id="solar-tariff" name="tariff" type="number" min="0.1" max="20" step="0.01" value="4" required inputmode="decimal" aria-describedby="solar-tariff-help"><p id="solar-tariff-help" class="estimator-help">$4 es un supuesto editable, no una tarifa oficial de CFE. No modela subsidios ni bloques tarifarios.</p></div><div class="estimator-field" data-nonenergy-field hidden><label for="solar-nonenergy">Parte del recibo no compensable (%)</label><input id="solar-nonenergy" name="nonEnergy" type="number" min="0" max="100" step="1" value="10" required inputmode="decimal"><p class="estimator-help">10% supuesto para cargos, impuestos y otros conceptos. Ajústalo según tu recibo.</p></div><p class="estimator-help">Módulos de 585 W · 3.2 m² por panel · generación supuesta de 1,350–1,650 kWh/kWp al año, pérdidas incluidas. Mismo supuesto en ambas zonas.</p></div></details>
        <p class="estimator-validation" data-validation role="status"></p>
      </form>
      <div class="estimator-result">
        <div class="estimator-result-top"><span><i aria-hidden="true"></i> TU ESCENARIO SOLAR</span><span>01 — 02</span></div>
        <div class="estimator-panel-visual" aria-hidden="true"><img src="${import.meta.env.BASE_URL}images/panel-detail.webp" alt="" width="180" height="95" loading="lazy"/><span>DISEÑADO ALREDEDOR DE TI</span></div>
        <div class="estimator-saving"><p>Ahorro anual ilustrativo en energía</p><strong data-savings>$18,796 – $22,800</strong><span>MXN / año</span></div>
        <div class="estimator-stats"><div><strong data-panel-count>7</strong><span>paneles de 585 W</span></div><div><strong data-power>4.10 <small>kWp</small></strong><span>capacidad instalada</span></div><div><strong data-coverage>92–100<small>%</small></strong><span>del consumo anual*</span></div></div>
        <div class="estimator-price"><span>Presupuesto ilustrativo</span><strong data-price>$104,090 – $132,660</strong></div>
        <button class="estimator-download" type="button" data-download>Descargar mi escenario <span class="button-icon" aria-hidden="true"><span class="material-symbol " aria-hidden="true">download</span></span></button>
        <p class="estimator-pdf-status" data-pdf-status role="status" aria-live="polite">PDF con tus números y todos los supuestos.</p>
        <p class="estimator-sr-only" data-live aria-live="polite" aria-atomic="true"></p>
      </div>
    </div>
    <div class="estimator-footnotes"><p data-roof-note>La distribución final se define en una visita técnica.</p><p>*Cobertura energética anual, no reducción porcentual del recibo. El ahorro excluye cargos fijos y no valora excedentes anuales. Precio demostrativo no vinculante, con IVA contemplado; sin batería, cargador, obra civil ni adecuaciones. HELIO es una marca ficticia.</p><details><summary>Cómo se calcula y fuentes de referencia</summary><p>Se dimensiona para un objetivo del 90% del consumo, con 1,500 kWh/kWp al año y limitado por el techo disponible. Ahorro: energía generada hasta el consumo anual × costo equivalente × 85–95%, factores prudentes del prototipo. Precio: $14,000 + $22,000/kWp a $18,000 + $28,000/kWp. La producción es un supuesto de diseño; no se ha simulado tu ubicación. Orientación, sombras, interconexión y tarifa requieren validación.</p><div class="estimator-sources">${QUOTE_SOURCES.map(source => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} <span class="material-symbol " aria-hidden="true">open_in_new</span></a>`).join('')}</div></details></div>
  `;
  const get = <T extends Element>(selector: string): T => {
    const node = element.querySelector<T>(selector);
    if (!node) throw new Error(`No se encontró ${selector}`);
    return node;
  };
  const form = get<HTMLFormElement>('form');
  const amount = get<HTMLInputElement>('#solar-amount');
  const roof = get<HTMLInputElement>('#solar-roof');
  const download = get<HTMLButtonElement>('[data-download]');
  let currentMode: QuoteInput['mode'] = 'consumption';
  let busy = false;
  let liveTimeout: ReturnType<typeof setTimeout>;
  const readInput = (): QuoteInput => ({
    mode: get<HTMLInputElement>('input[name="solar-mode"]:checked').value as QuoteInput['mode'],
    period: get<HTMLSelectElement>('#solar-period').value as QuoteInput['period'],
    amount: amount.valueAsNumber,
    tariff: get<HTMLInputElement>('#solar-tariff').valueAsNumber,
    roofArea: roof.valueAsNumber,
    nonEnergyPercent: get<HTMLInputElement>('#solar-nonenergy').valueAsNumber,
    location: get<HTMLSelectElement>('#solar-location').value as QuoteInput['location'],
  });
  function update() {
    let input = readInput();
    if (input.mode !== currentMode) {
      // Preserve the same implied consumption when switching entry modes.
      const factor = input.tariff / Math.max(0.01, 1 - input.nonEnergyPercent / 100);
      amount.value = String(Math.round(input.mode === 'bill' ? input.amount * factor : input.amount / factor));
      currentMode = input.mode;
      amount.max = input.mode === 'bill' ? '200000' : '50000';
      get<HTMLElement>('[data-amount-label]').textContent = input.mode === 'bill' ? 'Importe de tu recibo' : 'Consumo del recibo';
      get<HTMLElement>('[data-amount-unit]').textContent = input.mode === 'bill' ? 'MXN' : 'kWh';
      get<HTMLElement>('#solar-amount-help').textContent = input.mode === 'bill' ? 'Se descuenta una parte no compensable. Puedes ajustarla en los supuestos.' : 'Busca “consumo” en tu recibo. Usar kWh mejora la estimación.';
      get<HTMLElement>('[data-nonenergy-field]').hidden = input.mode !== 'bill';
      input = readInput();
    }
    get<HTMLOutputElement>('[data-roof-value]').textContent = `${number(input.roofArea)} m²`;
    roof.style.setProperty('--range-progress', `${input.roofArea / 150 * 100}%`);
    try {
      const q = calculateQuote(input);
      get<HTMLElement>('[data-validation]').textContent = '';
      download.disabled = busy || q.panelCount === 0;
      get<HTMLElement>('[data-savings]').textContent = currencyRange(q.savingsLow, q.savingsHigh);
      get<HTMLElement>('[data-panel-count]').textContent = String(q.panelCount);
      get<HTMLElement>('[data-power]').textContent = `${number(q.capacityKw, 2)} kWp`;
      get<HTMLElement>('[data-coverage]').textContent = `${number(q.coverageLow)}–${number(q.coverageHigh)}%`;
      get<HTMLElement>('[data-price]').textContent = currencyRange(q.priceLow, q.priceHigh);
      get<HTMLElement>('[data-roof-note]').textContent = q.panelCount === 0 ? 'Necesitamos consumo mayor a cero y al menos 3.2 m² de techo para estimar un sistema.' : q.roofLimited ? `El techo limita el escenario a ${q.panelCount} paneles. El objetivo de consumo necesitaría ${q.targetPanels}; revisemos las posibilidades en una visita técnica.` : `Tu escenario contempla ${q.panelCount} paneles en aproximadamente ${number(q.areaRequired, 1)} m². La distribución final requiere una visita técnica.`;
      clearTimeout(liveTimeout);
      liveTimeout = setTimeout(() => { get<HTMLElement>('[data-live]').textContent = `${q.panelCount} paneles. Ahorro anual ilustrativo de ${currencyRange(q.savingsLow, q.savingsHigh)} pesos.`; }, 350);
    } catch (error) {
      download.disabled = true;
      get<HTMLElement>('[data-validation]').textContent = error instanceof Error ? error.message : 'Revisa los datos ingresados.';
    }
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => event.preventDefault());
  download.addEventListener('click', async () => {
    if (busy) return;
    const input = readInput();
    busy = true; download.disabled = true;
    const status = get<HTMLElement>('[data-pdf-status]');
    status.textContent = 'Preparando tu escenario…';
    try {
      const pdf = await createQuotePdf(input);
      pdf.save(`HELIO-escenario-solar-${new Date().toISOString().slice(0, 10)}.pdf`);
      status.textContent = 'Listo. Tu PDF está preparado para guardar.';
    } catch {
      status.textContent = 'No pudimos crear el PDF. Intenta de nuevo.';
    } finally { busy = false; update(); }
  });
  update();
}
