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

  return (
    <div className={darkMode ? "dark" : ""}>
      <main className="min-h-screen bg-[#edf4f5] px-4 py-6 text-[#183036] transition-colors dark:bg-[#0b1114] dark:text-[#f1f7f8] sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-7 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#16869a] font-bold text-white" aria-hidden>{currency.symbol}</div>
            <div className="min-w-0 flex-1"><h1 className="text-xl font-bold tracking-[-.025em] sm:text-2xl">{text.title}</h1><p className="mt-0.5 text-sm text-[#657b80] dark:text-[#9fb1b6]">{text.subtitle}</p></div>
            <button type="button" onClick={toggleTheme} aria-label={darkMode ? text.lightMode : text.darkMode} title={darkMode ? text.lightMode : text.darkMode} className="grid size-10 place-items-center rounded-xl border border-[#cfdde0] bg-white text-lg text-[#16869a] transition hover:bg-[#e3f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16869a] dark:border-[#34454a] dark:bg-[#121b1f] dark:text-[#71d7e8] dark:hover:bg-[#203036]"><span className="dark:hidden" aria-hidden>{text.darkModeSymbol}</span><span className="hidden dark:inline" aria-hidden>{text.lightModeSymbol}</span></button>
          </header>

          <section className="overflow-hidden rounded-[28px] border border-[#cfdde0] bg-white shadow-[0_20px_60px_-32px_rgba(23,72,82,.25)] dark:border-[#29393e] dark:bg-[#10181c] dark:shadow-none">
            <div className="border-b border-[#e1ebed] p-5 dark:border-[#29393e] sm:p-7">
              <div className="flex rounded-xl bg-[#e8f0f2] p-1 dark:bg-[#091013]" role="radiogroup" aria-label={text.calculationType}>{modes.map(({ value, label }) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setMode(value)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16869a] dark:focus-visible:ring-[#39b9cc] ${mode === value ? 'bg-white font-semibold text-[#16869a] shadow-sm dark:bg-[#203036] dark:text-[#71d7e8]' : 'font-medium text-[#657b80] dark:text-[#8fa2a7]'}`}>{label}</button>)}</div>
              <div className="mt-7 grid min-w-0 gap-4 md:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-[#cfdde0] p-5 focus-within:border-[#29aabd] focus-within:ring-4 focus-within:ring-[#29aabd]/10 dark:border-[#34454a] dark:bg-[#0b1215] dark:focus-within:border-[#39b9cc] dark:focus-within:ring-[#39b9cc]/10"><label htmlFor="paga" className="text-xs font-semibold uppercase tracking-[.12em] text-[#657b80] dark:text-[#b9c8cc]">{inputLabel}</label><div className="mt-2 flex min-w-0 items-baseline"><span className="text-2xl text-[#879ba0]">{currency.symbol}</span><input id="paga" type="number" inputMode="decimal" min={input.minimum} step={input.step} value={amount} onChange={event => setAmount(event.target.value)} placeholder={input.placeholder} className="min-w-0 flex-1 bg-transparent pl-2 text-4xl font-semibold tracking-[-.04em] outline-none placeholder:text-[#cfdddf] dark:text-[#f1f7f8] dark:placeholder:text-[#526368]" /></div></div>
                <div className="min-w-0 overflow-hidden rounded-2xl bg-[#16869a] p-5 text-white dark:bg-[#167f91]"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#d9f4f7] dark:text-[#d4f6fa]">{outputLabel}</p><p className="mt-3 break-all text-2xl font-bold tracking-[-.035em] tabular-nums sm:text-3xl">{formatMoney(outputValue)}</p></div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2"><ContributionCard label={text.workerContribution} value={result.worker} rate={workerRate} setRate={setWorkerRate} deduction /><ContributionCard label={text.employerContribution} value={result.employer} rate={employerRate} setRate={setEmployerRate} /></div>
              <div className="mt-7 grid gap-7 md:grid-cols-2">
                <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#879ba0] dark:text-[#7f9297]">{text.summary}</p><div className="divide-y divide-[#e1ebed] dark:divide-[#29393e]"><ResultRow label={inputLabel} value={formatMoney(mode === "neto-bruto" ? result.neto : result.bruto)} /><ResultRow label={text.taxableSalary} value={formatMoney(result.taxable)} /><ResultRow label={text.totalTax} value={`−${formatMoney(result.tax)}`} /></div></div>
                <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#879ba0] dark:text-[#7f9297]">{text.incomeTax}</p><div className="rounded-2xl bg-[#f1f6f7] px-4 py-1 dark:bg-[#0b1215]">{taxBrackets.map((bracket, index) => <TaxRow key={bracket.label} label={bracket.label} rate={bracket.rate ? `${bracket.rate}${text.percentSymbol}` : undefined} value={result.bracketTaxes[index]} deduction={bracket.rate > 0} />)}</div></div>
              </div>
            </div>
          </section>
          <footer className="mt-5 text-center text-xs text-[#879ba0] dark:text-[#687a7f]">{text.taxRates}: {taxBrackets.map(({ rate }) => `${rate}${text.percentSymbol}`).join(text.rateSeparator)}</footer>
        </div>
      </main>
    </div>
  );
}

function ContributionCard({ label, value, rate, setRate, deduction = false }: { label: string; value: number; rate: number; setRate: (value: number) => void; deduction?: boolean }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#cfdde0] p-4 dark:border-[#34454a] dark:bg-[#0b1215]/60"><div><p className="text-sm font-medium text-[#183036] dark:text-[#f1f7f8]">{label}</p><p className={`mt-1 text-xs font-semibold ${deduction ? 'text-[#d05262] dark:text-[#ff8794]' : 'text-[#879ba0] dark:text-[#7f9297]'}`}>{formatMoney(value)}</p></div><Stepper value={rate} onChange={setRate} label={label.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} /></div>;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return <div className="row"><span className="row-label">{label}</span><span className="row-value">{value}</span></div>;
}

function TaxRow({ label, rate, value, deduction = false }: TaxRowProps) {
  return <div className="row border-b border-[#e1ebed] py-2.5 last:border-0 dark:border-[#29393e]"><span className="text-sm text-[#657b80] dark:text-[#b9c8cc]">{label}{rate && <span className="ml-2 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#16869a] ring-1 ring-[#cfdde0] dark:bg-[#172328] dark:text-[#71d7e8] dark:ring-[#34454a]">{rate}</span>}</span><span className={`row-value ${deduction ? 'text-[#d05262] dark:text-[#ff8794]' : 'text-[#879ba0] dark:text-[#687a7f]'}`}>{formatMoney(value)}</span></div>;
}
