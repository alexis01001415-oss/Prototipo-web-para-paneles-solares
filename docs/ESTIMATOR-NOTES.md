# HELIO estimator integration

Integrated as section 07 in HELIO. `src/quote-model.ts` contains the pure model and assumptions; `src/estimator.ts` contains the form and PDF renderer and imports `estimator.css`. Dependency: `jspdf`, lazy imported only on download. `main.ts` calls `mountEstimator()` once on `#estimator` when the section approaches the viewport. The section heading and outer spacing live in the main page.

Model exports: `QuoteInput`, `QuoteResult`, `DEFAULT_QUOTE_INPUT`, `QUOTE_ASSUMPTIONS`, `QUOTE_SOURCES`, `calculateQuote(input)`. UI module exports `createQuotePdf(input, optionalDate)` and `mountEstimator(element)` and re-exports model values.

No network/API key, persistence, email capture, or backend is required. The native radio/select/number/range inputs recalculate synchronously; result announcements are debounced. PDF generation captures the inputs at click time, lazy-loads jsPDF, and produces 2 A4 pages in HELIO colors with equations, disclaimer and reference links.

## Scope and assumptions

- Default mode: actual 1,000 kWh over a bimonthly period. Monthly mode normalizes by 12, bimonthly by 6.
- Money mode excludes a user-adjustable 10% for non-energy charges before dividing by a user-adjustable 4 MXN/kWh. Neither is an official CFE rate or tax calculation.
- Panels: 585 W; conceptual installation area 3.2 m²/panel. Roof cap always enforced. Target: 90% consumption, calculated using 1,500 kWh/kWp/year.
- Production: 1,350–1,650 kWh/kWp/year, explicitly labeled a hypothetical design assumption with losses included; not an address-specific weather simulation. Same assumption in CDMX and metropolitan selections. Shadows, azimuth, pitch, structural capacity and equipment unknown.
- Savings: min(production, consumption) × equivalent electricity cost × 85–95%. Excludes non-energy charges; annual excess energy has no assigned revenue; no guaranteed utility bill reduction.
- Price: 14,000 + 22,000 × kWp to 18,000 + 28,000 × kWp (MXN; hypothetical VAT-inclusive envelope). Explicitly **illustrative**, neither a researched market quote nor binding offer. Batteries, EV charger, civil work, strengthening, financing and grid adaptations excluded.
- No fake claim of being a real company. HELIO is marked fictional.

## Primary references checked September 18, 2026

1. CFE contracts: https://www.cfe.gob.mx/industria/nuevocontrato/Pages/contratos-de-interonexion.aspx — distinguishes net metering, net billing and total sale. Only net metering subtracts generation from consumption. Search index returned full official page content; direct tool open returned 403.
2. CFE distributed generation: https://app.cfe.mx/aplicaciones/generaciondistribuida/ — procedure/approval and supplier-based interconnection request workflow.
3. Global Solar Atlas FAQ: https://globalsolaratlas.info/support/faq — PVOUT is electricity generated per kWp; installation area depends on module efficiency and spacing. No numeric CDMX yield was asserted from this source.
4. PVWatts: https://pvwatts.nlr.gov/pvwatts.php — location, climate, losses and site characteristics influence model outputs. Current official result uses `nlr.gov`; historical `nrel.gov` redirects/may fail. This prototype does not call PVWatts or pretend to use its numerical output.

## Verification

`npm test` runs the portable `tests/quote.test.ts` against the pure model. It checks 438 consumption/roof combinations, invalid values, period equivalence, non-energy charges, no-roof/no-consumption results, range ordering and savings ceilings. It doesn't require a browser or modify app files.

The PDF artifact operation marker was run once before generating the developer QA document outside the site. Both pages were rendered with bundled Poppler and visually inspected. The source module fits large figures to available width, and result CSS wraps the price on narrow screens. The integrated download was also exercised in the browser.
