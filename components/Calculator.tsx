"use client";

import { useEffect, useMemo, useState } from "react";
import calculatorJson from "@/data/calculator.json";
import type {
  CalculatorData,
  CalculationMode,
  CalculationResult,
  StepperProps,
  TaxRowProps,
} from "@/types/calculator";

const data = calculatorJson as CalculatorData;
const { calculation, contributions, currency, input, modes, taxBrackets, text, theme } = data;
const zero: CalculationResult = { bruto: 0, worker: 0, employer: 0, taxable: 0, bracketTaxes: taxBrackets.map(() => 0), tax: 0, neto: 0 };
// Keep SSR and browser output identical. Runtime support for the sq-XK locale
// differs between Node.js and browsers, which otherwise causes hydration errors.
function formatMoney(value: number) {
  return `${currency.symbol}${value.toFixed(currency.decimalPlaces)}`;
}

function fromGross(bruto: number, workerRate: number, employerRate: number): CalculationResult {
  if (!Number.isFinite(bruto) || bruto <= 0) return zero;
  const worker = bruto * workerRate / 100;
  const employer = bruto * employerRate / 100;
  const taxable = bruto - worker;
  const bracketTaxes = taxBrackets.map(({ minimum, maximum, rate }) => {
    const taxableInBracket = Math.max(0, Math.min(taxable, maximum ?? taxable) - minimum);
    return taxableInBracket * rate / 100;
  });
  const tax = bracketTaxes.reduce((total, bracketTax) => total + bracketTax, 0);
  return { bruto, worker, employer, taxable, bracketTaxes, tax, neto: taxable - tax };
}

function fromNet(target: number, workerRate: number, employerRate: number): CalculationResult {
  if (!Number.isFinite(target) || target <= 0) return zero;
  let low = 0, high = Math.max(target * calculation.grossSearchMultiplier, calculation.grossSearchMinimum);
  for (let i = 0; i < calculation.iterations; i++) {
    const middle = (low + high) / 2;
    if (fromGross(middle, workerRate, employerRate).neto < target) low = middle;
    else high = middle;
  }
  return fromGross((low + high) / 2, workerRate, employerRate);
}

function Stepper({ value, onChange, label, minimum, maximum }: StepperProps) {
  return <div className="stepper" aria-label={label}>
    <button className="stepper-button" type="button" disabled={value <= minimum} onClick={() => onChange(value - 1)} aria-label={`${text.decrease} ${label}`}>{text.minusSymbol}</button>
    <span className="w-11 text-center text-xs font-semibold tabular-nums">{value}{text.percentSymbol}</span>
    <button className="stepper-button" type="button" disabled={value >= maximum} onClick={() => onChange(value + 1)} aria-label={`${text.increase} ${label}`}>{text.plusSymbol}</button>
  </div>;
}

export default function Calculator() {
  const [darkMode, setDarkMode] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<CalculationMode>(calculation.defaultMode);
  const [workerRate, setWorkerRate] = useState(contributions.workerDefault);
  const [employerRate, setEmployerRate] = useState(contributions.employerDefault);
  const result = useMemo(() => mode === "bruto-neto" ? fromGross(parseFloat(amount), workerRate, employerRate) : fromNet(parseFloat(amount), workerRate, employerRate), [amount, mode, workerRate, employerRate]);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    setDarkMode(current => {
      const nextTheme = !current;
      window.localStorage.setItem(theme.storageKey, nextTheme ? "dark" : "light");
      document.documentElement.classList.toggle("dark", nextTheme);
      document.documentElement.style.colorScheme = nextTheme ? "dark" : "light";
      return nextTheme;
    });
  }

  const inputLabel = mode === "neto-bruto" ? text.netSalary : text.grossSalary;
  const outputLabel = mode === "neto-bruto" ? text.grossSalary : text.netSalary;
  const outputValue = mode === "neto-bruto" ? result.bruto : result.neto;

  return <div className={darkMode ? "dark" : ""}>
  <main className="min-h-screen bg-[#e9edf0] px-3 py-5 text-[#2f3b46] transition-colors dark:bg-[#0d1522] dark:text-[#f4f8ff] sm:px-5 sm:py-8">
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#536f8b] text-xl font-bold text-white shadow-lg shadow-[#536f8b]/15 sm:size-[52px] sm:rounded-[14px] sm:text-2xl" aria-hidden>{currency.symbol}</div>
        <div className="min-w-0 flex-1"><h1 className="text-lg font-bold leading-tight tracking-tight sm:text-xl">{text.title}</h1><p className="mt-1 hidden text-sm text-[#6f7880] dark:text-[#aebdd2] min-[390px]:block">{text.subtitle}</p></div>
        <button type="button" onClick={toggleTheme} aria-label={darkMode ? text.lightMode : text.darkMode} title={darkMode ? text.lightMode : text.darkMode} className="grid size-11 shrink-0 place-items-center rounded-full border border-[#d3d9dd] bg-[#f7f8f8] text-lg text-[#536f8b] transition hover:bg-[#e0e6e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#536f8b] dark:border-[#40516a] dark:bg-[#182438] dark:text-[#8fc5ff] dark:hover:bg-[#24344d] sm:size-10">
          <span className="dark:hidden" aria-hidden>{text.darkModeSymbol}</span>
          <span className="hidden dark:inline" aria-hidden>{text.lightModeSymbol}</span>
        </button>
      </header>
      <section className="overflow-hidden rounded-3xl border border-[#d3d9dd] bg-[#f7f8f8] shadow-[0_10px_30px_rgba(49,62,73,.07)] dark:border-[#31415a] dark:bg-[#141f31]">
        <div className="bg-[#536f8b] px-5 py-6 text-white dark:bg-[#315f93] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-white/65">{outputLabel}</p><p className="mt-2 break-all text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">{formatMoney(outputValue)}</p></div>
            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur-sm"><span className="text-white/60">{inputLabel}</span><strong className="ml-3 tabular-nums">{formatMoney(mode === "neto-bruto" ? result.neto : result.bruto)}</strong></div>
          </div>
        </div>

        <div className="p-4 sm:p-7">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="flex rounded-xl bg-[#e3e8eb] p-1 dark:bg-[#0f1928]" role="radiogroup" aria-label={text.calculationType}>{modes.map(({ value, label }) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setMode(value)} className={`min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm transition ${mode === value ? 'bg-[#f7f8f8] font-semibold text-[#536f8b] shadow-sm dark:bg-[#24344d] dark:text-[#8fc5ff]' : 'text-[#6f7880] dark:text-[#9bacc4]'}`}>{label}</button>)}</div>
            <div className="flex min-w-0 items-center rounded-xl border-2 border-[#d3d9dd] bg-[#f7f8f8] focus-within:border-[#536f8b] dark:border-[#40516a] dark:bg-[#0f1928]"><span className="pl-4 text-xl text-[#7c858c]">{currency.symbol}</span><input id="paga" aria-label={inputLabel} type="number" inputMode="decimal" min={input.minimum} step={input.step} value={amount} onChange={e => setAmount(e.target.value)} placeholder={input.placeholder} className="min-w-0 w-full bg-transparent py-3 pl-2 pr-4 text-2xl font-semibold outline-none dark:text-white md:w-56" /></div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2"><ContributionControl label={text.workerContribution} value={result.worker} rate={workerRate} onRateChange={setWorkerRate} deduction /><ContributionControl label={text.employerContribution} value={result.employer} rate={employerRate} onRateChange={setEmployerRate} /></div>

          <div className="mt-7 grid gap-7 md:grid-cols-2">
            <div className="md:flex md:flex-col md:justify-center"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#c4d2e4]">{text.summary}</p><div className="divide-y divide-slate-100 border-y border-slate-200 dark:divide-[#31415a] dark:border-[#31415a]"><SummaryRow label={text.workerContribution} value={`−${formatMoney(result.worker)}`} deduction /><SummaryRow label={text.employerContribution} value={formatMoney(result.employer)} /><SummaryRow label={text.taxableSalary} value={formatMoney(result.taxable)} /></div></div>
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6f7880] dark:text-[#c4d2e4]">{text.incomeTax}</p><div className="rounded-2xl bg-[#eef1f2] px-4 py-2 dark:bg-[#0f1928]">{taxBrackets.map((bracket, index) => <TaxRow key={bracket.label} label={bracket.label} rate={bracket.rate ? `${bracket.rate}${text.percentSymbol}` : undefined} value={result.bracketTaxes[index]} deduction={bracket.rate > 0} />)}<div className="row mt-1 border-t border-[#d3d9dd] px-0 dark:border-[#31415a]"><span className="row-label font-semibold">{text.totalTax}</span><span className="row-value text-[#ad6265] dark:text-[#ff92a5]">−{formatMoney(result.tax)}</span></div></div></div>
          </div>
        </div>
      </section>
      <footer className="mt-5 text-center text-xs text-slate-500 dark:text-[#8294ad]">{text.taxRates}: {taxBrackets.map(({ rate }) => `${rate}${text.percentSymbol}`).join(text.rateSeparator)}</footer>
    </div>
  </main>
  </div>;
}

function TaxRow({ label, rate, value, deduction = false }: TaxRowProps) {
  return <div className="row px-0"><span className="text-sm text-slate-500 dark:text-[#c4d2e4]">{label}{rate && <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-[#193556] dark:text-[#8fc5ff]">{rate}</span>}</span><span className={`row-value ${deduction ? 'text-red-600 dark:text-[#ff92a5]' : ''}`}>{formatMoney(value)}</span></div>;
}

function ContributionControl({ label, value, rate, onRateChange, deduction = false }: { label: string; value: number; rate: number; onRateChange: (value: number) => void; deduction?: boolean }) {
  const formattedValue = formatMoney(value);
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[#d3d9dd] bg-[#f3f5f5] p-3 dark:border-[#40516a] dark:bg-[#182438] sm:grid-cols-[minmax(130px,1fr)_auto_minmax(80px,120px)] sm:gap-3"><span className="row-label min-w-0 leading-snug">{label}</span><Stepper value={rate} onChange={onRateChange} label={label.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} /><span title={formattedValue} className={`row-value col-span-2 block min-w-0 truncate text-left sm:col-span-1 sm:text-right ${deduction ? "text-[#ad6265] dark:text-[#ff92a5]" : ""}`}>{formattedValue}</span></div>;
}

function SummaryRow({ label, value, deduction = false }: { label: string; value: string; deduction?: boolean }) {
  return <div className="row px-0"><span className="row-label">{label}</span><span className={`row-value ${deduction ? "text-red-600 dark:text-[#ff92a5]" : ""}`}>{value}</span></div>;
}
