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
      <main className="min-h-screen bg-[#f2f0f8] px-4 py-6 text-[#242039] transition-colors dark:bg-[#110f1b] dark:text-[#f5f2ff] sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-7 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#6650c8] font-bold text-white" aria-hidden>{currency.symbol}</div>
            <div className="min-w-0 flex-1"><h1 className="text-xl font-bold tracking-[-.025em] sm:text-2xl">{text.title}</h1><p className="mt-0.5 text-sm text-[#736d89] dark:text-[#b8b0ce]">{text.subtitle}</p></div>
            <button type="button" onClick={toggleTheme} aria-label={darkMode ? text.lightMode : text.darkMode} title={darkMode ? text.lightMode : text.darkMode} className="grid size-10 place-items-center rounded-xl border border-[#ded9ea] bg-white text-lg text-[#6650c8] transition hover:bg-[#eeeaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6650c8] dark:border-[#443d59] dark:bg-[#1b1728] dark:text-[#c7b8ff] dark:hover:bg-[#302a42]"><span className="dark:hidden" aria-hidden>{text.darkModeSymbol}</span><span className="hidden dark:inline" aria-hidden>{text.lightModeSymbol}</span></button>
          </header>

          <section className="overflow-hidden rounded-[28px] border border-[#ded9ea] bg-white shadow-[0_20px_60px_-32px_rgba(54,42,90,.3)] dark:border-[#332d45] dark:bg-[#181421] dark:shadow-none">
            <div className="border-b border-[#ebe7f2] p-5 dark:border-[#332d45] sm:p-7">
              <div className="flex rounded-xl bg-[#f0edf6] p-1 dark:bg-[#0f0c17]" role="radiogroup" aria-label={text.calculationType}>{modes.map(({ value, label }) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setMode(value)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6650c8] ${mode === value ? 'bg-white font-semibold text-[#6650c8] shadow-sm dark:bg-[#2a2439] dark:text-[#c7b8ff]' : 'font-medium text-[#736d89] dark:text-[#9f97b6]'}`}>{label}</button>)}</div>
              <div className="mt-7 grid min-w-0 gap-4 md:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-[#ded9ea] p-5 focus-within:border-[#806bdc] focus-within:ring-4 focus-within:ring-[#806bdc]/10 dark:border-[#443d59] dark:bg-[#110e19]"><label htmlFor="paga" className="text-xs font-semibold uppercase tracking-[.12em] text-[#736d89] dark:text-[#a9a1bd]">{inputLabel}</label><div className="mt-2 flex min-w-0 items-baseline"><span className="text-2xl text-[#9992aa]">{currency.symbol}</span><input id="paga" type="number" inputMode="decimal" min={input.minimum} step={input.step} value={amount} onChange={event => setAmount(event.target.value)} placeholder={input.placeholder} className="min-w-0 flex-1 bg-transparent pl-2 text-4xl font-semibold tracking-[-.04em] outline-none placeholder:text-[#ded9ea] dark:text-white dark:placeholder:text-[#514961]" /></div></div>
                <div className="min-w-0 overflow-hidden rounded-2xl bg-[#6650c8] p-5 text-white dark:bg-[#5944b5]"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#ddd6ff]">{outputLabel}</p><p className="mt-3 break-all text-2xl font-bold tracking-[-.035em] tabular-nums sm:text-3xl">{formatMoney(outputValue)}</p></div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2"><ContributionCard label={text.workerContribution} value={result.worker} rate={workerRate} setRate={setWorkerRate} deduction /><ContributionCard label={text.employerContribution} value={result.employer} rate={employerRate} setRate={setEmployerRate} /></div>
              <div className="mt-7 grid gap-7 md:grid-cols-2">
                <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#9992aa]">{text.summary}</p><div className="divide-y divide-[#ebe7f2] dark:divide-[#332d45]"><ResultRow label={inputLabel} value={formatMoney(mode === "neto-bruto" ? result.neto : result.bruto)} /><ResultRow label={text.taxableSalary} value={formatMoney(result.taxable)} /><ResultRow label={text.totalTax} value={`−${formatMoney(result.tax)}`} /></div></div>
                <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#9992aa]">{text.incomeTax}</p><div className="rounded-2xl bg-[#f5f3f9] px-4 py-1 dark:bg-[#110e19]">{taxBrackets.map((bracket, index) => <TaxRow key={bracket.label} label={bracket.label} rate={bracket.rate ? `${bracket.rate}${text.percentSymbol}` : undefined} value={result.bracketTaxes[index]} deduction={bracket.rate > 0} />)}</div></div>
              </div>
            </div>
          </section>
          <footer className="mt-5 text-center text-xs text-[#9992aa] dark:text-[#777087]">{text.taxRates}: {taxBrackets.map(({ rate }) => `${rate}${text.percentSymbol}`).join(text.rateSeparator)}</footer>
        </div>
      </main>
    </div>
  );
}

function ContributionCard({ label, value, rate, setRate, deduction = false }: { label: string; value: number; rate: number; setRate: (value: number) => void; deduction?: boolean }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ded9ea] p-4 dark:border-[#443d59] dark:bg-[#110e19]/60"><div><p className="text-sm font-medium text-[#4e485f] dark:text-[#e2ddef]">{label}</p><p className={`mt-1 text-xs font-semibold ${deduction ? 'text-[#c44b6c] dark:text-[#ff8cad]' : 'text-[#9992aa]'}`}>{formatMoney(value)}</p></div><Stepper value={rate} onChange={setRate} label={label.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} /></div>;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return <div className="row"><span className="row-label">{label}</span><span className="row-value">{value}</span></div>;
}

function TaxRow({ label, rate, value, deduction = false }: TaxRowProps) {
  return <div className="row border-b border-[#e7e3ef] py-2.5 last:border-0 dark:border-[#332d45]"><span className="text-sm text-[#736d89] dark:text-[#c3bdd5]">{label}{rate && <span className="ml-2 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#6650c8] ring-1 ring-[#ded9ea] dark:bg-[#211c2e] dark:text-[#c7b8ff] dark:ring-[#443d59]">{rate}</span>}</span><span className={`row-value ${deduction ? 'text-[#c44b6c] dark:text-[#ff8cad]' : 'text-[#aaa4b7] dark:text-[#777087]'}`}>{formatMoney(value)}</span></div>;
}
