"use client";

import { useEffect, useMemo, useState } from "react";
import calculatorJson from "@/data/calculator.json";
import type {
  CalculatorData,
  CalculationMode,
  CalculationResult,
  ContributionRowProps,
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
  <main className="min-h-screen bg-[#f3f0ea] px-4 py-6 text-[#172033] transition-colors dark:bg-[#0b1220] dark:text-slate-100 sm:px-6 sm:py-10">
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-10 flex items-start justify-between gap-6 border-b border-[#d9d6cf] pb-6 dark:border-slate-800">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-[#1f3a5f] dark:text-blue-300">{text.country} · {currency.symbol}</p><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">{text.title}</h1><p className="mt-2 text-sm text-[#697080] dark:text-slate-300">{text.subtitle}</p></div>
        <button type="button" onClick={toggleTheme} aria-label={darkMode ? text.lightMode : text.darkMode} title={darkMode ? text.lightMode : text.darkMode} className="grid size-10 shrink-0 place-items-center rounded-full border border-[#1f3a5f] bg-transparent text-lg text-[#1f3a5f] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a5f] dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800">
          <span className="dark:hidden" aria-hidden>{text.darkModeSymbol}</span><span className="hidden dark:inline" aria-hidden>{text.lightModeSymbol}</span>
        </button>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#d9d6cf] bg-[#fffefa] shadow-[0_12px_32px_rgba(23,32,51,.045)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_12px_32px_rgba(0,0,0,.25)]">
        <div className="grid border-b border-[#dedbd4] dark:border-slate-800 md:grid-cols-[1fr_auto_1fr]">
          <div className="p-5 sm:p-7">
            <label htmlFor="paga" className="block text-xs font-semibold uppercase tracking-[.14em] text-[#697080] dark:text-slate-300">{inputLabel}</label>
            <div className="mt-3 flex items-baseline border-b border-[#bfc2c9] pb-2 focus-within:border-[#1f3a5f] dark:border-slate-700 dark:focus-within:border-blue-400">
              <span className="text-2xl text-[#697080] dark:text-slate-300">{currency.symbol}</span>
              <input id="paga" type="number" inputMode="decimal" min={input.minimum} step={input.step} value={amount} onChange={event => setAmount(event.target.value)} placeholder={input.placeholder} className="min-w-0 flex-1 bg-transparent pl-2 text-4xl font-medium tracking-[-.04em] outline-none placeholder:text-[#d7d5d0] dark:text-white dark:placeholder:text-slate-700" />
            </div>
          </div>

          <div className="hidden w-px bg-[#dedbd4] dark:bg-slate-800 md:block" />

          <div className="bg-[#1f3a5f] p-5 text-white dark:bg-[#19345a] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-white/60">{outputLabel}</p>
            <p className="mt-3 text-4xl font-medium tracking-[-.04em] tabular-nums">{formatMoney(outputValue)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-[260px_1fr]">
          <aside className="border-b border-[#dedbd4] bg-[#faf9f6] p-5 dark:border-slate-800 dark:bg-[#111a2a] sm:p-7 md:border-b-0 md:border-r" aria-label={text.calculationType}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-[#8b909b] dark:text-slate-300">{text.calculationType}</p>
            <div className="space-y-2" role="radiogroup" aria-label={text.calculationType}>
              {modes.map(({ value, label }) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setMode(value)} className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a5f] ${mode === value ? 'border-[#1f3a5f] bg-white font-semibold text-[#1f3a5f] dark:border-blue-500 dark:bg-slate-900 dark:text-blue-300' : 'border-transparent text-[#697080] hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'}`}><span>{label}</span><span className={`size-2 rounded-full ${mode === value ? 'bg-[#1f3a5f] dark:bg-blue-400' : 'bg-[#d5d3cd] dark:bg-slate-700'}`} /></button>)}
            </div>

            <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[.14em] text-[#8b909b] dark:text-slate-300">{text.contributions}</p>
            <CompactContribution label={text.workerContribution} rate={workerRate} setRate={setWorkerRate} />
            <CompactContribution label={text.employerContribution} rate={employerRate} setRate={setEmployerRate} />
          </aside>

          <div className="p-5 sm:p-7">
            <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="font-semibold dark:text-white">{text.summary}</h2><p className="mt-1 text-xs text-[#8b909b] dark:text-slate-300">{text.taxRates}: {taxBrackets.map(({ rate }) => `${rate}${text.percentSymbol}`).join(text.rateSeparator)}</p></div><span className="text-xs font-medium text-[#697080] dark:text-slate-300">{modes.find(item => item.value === mode)?.label}</span></div>

            <div className="divide-y divide-[#ebe9e4] border-y border-[#dedbd4] dark:divide-slate-800 dark:border-slate-800">
              <ResultRow label={inputLabel} value={formatMoney(mode === "neto-bruto" ? result.neto : result.bruto)} />
              <ResultRow label={text.workerContribution} value={`−${formatMoney(result.worker)}`} />
              <ResultRow label={text.employerContribution} value={formatMoney(result.employer)} />
              <ResultRow label={text.taxableSalary} value={formatMoney(result.taxable)} />
            </div>

            <div className="mt-7">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[.14em] text-[#8b909b] dark:text-slate-300">{text.incomeTax}</p>
              {taxBrackets.map((bracket, index) => <TaxRow key={bracket.label} label={bracket.label} rate={bracket.rate ? `${bracket.rate}${text.percentSymbol}` : undefined} value={result.bracketTaxes[index]} deduction={bracket.rate > 0} />)}
              <div className="row mt-2 border-t border-[#dedbd4] dark:border-slate-800"><span className="row-label font-semibold text-[#172033] dark:text-slate-100">{text.totalTax}</span><span className="row-value text-[#9f3e3e] dark:text-rose-400">−{formatMoney(result.tax)}</span></div>
            </div>
          </div>
        </div>
      </section>
      <footer className="mt-5 text-center text-xs text-[#9297a1] dark:text-slate-400">{text.subtitle}</footer>
    </div>
  </main>
  </div>;
}

function CompactContribution({ label, rate, setRate }: Pick<ContributionRowProps, "label" | "rate" | "setRate">) {
  return <div className="mb-3"><p className="mb-2 text-xs text-[#697080] dark:text-slate-300">{label}</p><Stepper value={rate} onChange={setRate} label={label.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} /></div>;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return <div className="row"><span className="row-label">{label}</span><span className="row-value">{value}</span></div>;
}

function TaxRow({ label, rate, value, deduction = false }: TaxRowProps) {
  return <div className="row py-2.5"><span className="text-sm text-[#697080] dark:text-slate-300">{label}{rate && <span className="ml-2 rounded border border-[#d9d6cf] px-1.5 py-0.5 text-[10px] font-semibold text-[#697080] dark:border-slate-600 dark:text-slate-300">{rate}</span>}</span><span className={`row-value ${deduction ? 'text-[#9f3e3e] dark:text-rose-400' : 'text-[#a3a6ad] dark:text-slate-300'}`}>{formatMoney(value)}</span></div>;
}
