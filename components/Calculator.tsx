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

  return <div className={darkMode ? "dark" : ""}>
  <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <div className="w-full max-w-[680px]">
      <header className="mb-6 flex items-center gap-4">
        <div className="grid size-[52px] shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-blue-800 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-600/25" aria-hidden>{currency.symbol}</div>
        <div className="min-w-0 flex-1"><h1 className="text-xl font-bold tracking-tight">{text.title}</h1><p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">{text.subtitle}</p></div>
        <button type="button" onClick={toggleTheme} aria-label={darkMode ? text.lightMode : text.darkMode} title={darkMode ? text.lightMode : text.darkMode} className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-lg text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800">
          <span className="dark:hidden" aria-hidden>{text.darkModeSymbol}</span>
          <span className="hidden dark:inline" aria-hidden>{text.lightModeSymbol}</span>
        </button>
      </header>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
          <label htmlFor="paga" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">{text.amount}</label>
          <div className="flex items-center overflow-hidden rounded-[10px] border-2 border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/15 dark:border-slate-700 dark:bg-slate-950">
            <span className="pl-4 text-xl font-semibold text-slate-500 dark:text-slate-300">{currency.symbol}</span><input id="paga" type="number" inputMode="decimal" min={input.minimum} step={input.step} value={amount} onChange={e => setAmount(e.target.value)} placeholder={input.placeholder} className="w-full bg-transparent py-3.5 pl-2 pr-4 text-2xl font-semibold outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-700" />
          </div>
          <div className="mt-4 flex gap-2 rounded-[10px] bg-slate-50 p-1 dark:bg-slate-950" role="radiogroup" aria-label={text.calculationType}>
            {modes.map(({ value, label }) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setMode(value)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm transition ${mode === value ? 'bg-white font-semibold text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'font-medium text-slate-500 dark:text-slate-400'}`}>{label}</button>)}
          </div>
        </div>
        <div className="py-2">
          <div className="row bg-blue-50 dark:bg-blue-950/40">
            <span className="row-label">{mode === "neto-bruto" ? text.netSalary : text.grossSalary}</span>
            <span className="row-value">{formatMoney(mode === "neto-bruto" ? result.neto : result.bruto)}</span>
          </div>
          <div className="space-y-3 py-1">
            <div className="row relative"><span className="row-label">{text.workerContribution}</span><div className="absolute left-1/2 -translate-x-1/2"><Stepper value={workerRate} onChange={setWorkerRate} label={text.workerContribution.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} /></div><span className="row-value text-red-600">{formatMoney(result.worker)}</span></div>
            <div className="row relative"><span className="row-label">{text.employerContribution}</span><div className="absolute left-1/2 -translate-x-1/2"><Stepper value={employerRate} onChange={setEmployerRate} label={text.employerContribution.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} /></div><span className="row-value">{formatMoney(result.employer)}</span></div>
          </div>
          <div className="row"><span className="row-label">{text.taxableSalary}</span><span className="row-value">{formatMoney(result.taxable)}</span></div>
          <div className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300 sm:px-6">{text.incomeTax}</div>
          {taxBrackets.map((bracket, index) => <TaxRow key={bracket.label} label={bracket.label} rate={bracket.rate ? `${bracket.rate}${text.percentSymbol}` : undefined} value={result.bracketTaxes[index]} deduction={bracket.rate > 0} />)}
          <div className="row"><span className="row-label">{text.totalTax}</span><span className="row-value text-red-600">{formatMoney(result.tax)}</span></div>
          <div className="mx-4 mb-4 mt-2 flex items-center justify-between rounded-[10px] bg-gradient-to-br from-blue-800 to-blue-600 px-5 py-[18px] text-white">
            <span className="font-semibold text-white/90">{mode === "neto-bruto" ? text.grossSalary : text.netSalary}</span>
            <span className="text-xl font-bold tabular-nums sm:text-2xl">{formatMoney(mode === "neto-bruto" ? result.bruto : result.neto)}</span>
          </div>
        </div>
      </section>
      <footer className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">{text.taxRates}: {taxBrackets.map(({ rate }) => `${rate}${text.percentSymbol}`).join(text.rateSeparator)}</footer>
    </div>
  </main>
  </div>;
}

function TaxRow({ label, rate, value, deduction = false }: TaxRowProps) {
  return <div className="row pl-6 sm:pl-9"><span className="text-sm text-slate-500 dark:text-slate-300">{label}{rate && <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-950 dark:text-blue-300">{rate}</span>}</span><span className={`row-value ${deduction ? 'text-red-600 dark:text-rose-400' : ''}`}>{formatMoney(value)}</span></div>;
}
