"use client";

import { useMemo, useState } from "react";
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
const { calculation, contributions, currency, input, modes, taxBrackets, text } = data;
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
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<CalculationMode>(calculation.defaultMode);
  const [workerRate, setWorkerRate] = useState(contributions.workerDefault);
  const [employerRate, setEmployerRate] = useState(contributions.employerDefault);
  const result = useMemo(() => mode === "bruto-neto" ? fromGross(parseFloat(amount), workerRate, employerRate) : fromNet(parseFloat(amount), workerRate, employerRate), [amount, mode, workerRate, employerRate]);

  const inputLabel = mode === "neto-bruto" ? text.netSalary : text.grossSalary;
  const outputLabel = mode === "neto-bruto" ? text.grossSalary : text.netSalary;
  const outputValue = mode === "neto-bruto" ? result.bruto : result.neto;

  return <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8 flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-700 text-base font-semibold text-white" aria-hidden>{currency.symbol}</div>
        <div><h1 className="text-xl font-semibold tracking-[-.025em] text-slate-950 sm:text-2xl">{text.title}</h1><p className="mt-0.5 text-sm text-slate-500">{text.subtitle}</p></div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.05)] sm:p-6" aria-label={text.calculationType}>
          <div className="flex rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label={text.calculationType}>
            {modes.map(({ value, label }) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setMode(value)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${mode === value ? 'bg-white font-semibold text-slate-950 shadow-sm' : 'font-medium text-slate-500 hover:text-slate-700'}`}>{label}</button>)}
          </div>

          <div className="py-8">
            <label htmlFor="paga" className="mb-2 block text-sm font-medium text-slate-700">{inputLabel}</label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/10">
              <span className="text-2xl font-medium text-slate-400">{currency.symbol}</span>
              <input id="paga" type="number" inputMode="decimal" min={input.minimum} step={input.step} value={amount} onChange={event => setAmount(event.target.value)} placeholder={input.placeholder} className="min-w-0 flex-1 bg-transparent py-4 pl-2 text-3xl font-semibold tracking-[-.03em] text-slate-950 outline-none placeholder:text-slate-300" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm font-medium text-slate-500">{outputLabel}</p>
            <p className="mt-1 text-4xl font-semibold tracking-[-.04em] text-teal-700 tabular-nums">{formatMoney(outputValue)}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.05)] sm:p-7" aria-label={text.incomeTax}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div><h2 className="text-base font-semibold text-slate-950">{text.incomeTax}</h2><p className="mt-1 text-sm text-slate-500">{text.taxRates}: {taxBrackets.map(({ rate }) => `${rate}${text.percentSymbol}`).join(text.rateSeparator)}</p></div>
          </div>

          <div className="divide-y divide-slate-100">
            <ResultRow label={inputLabel} value={formatMoney(mode === "neto-bruto" ? result.neto : result.bruto)} />
            <ContributionRow label={text.workerContribution} value={result.worker} rate={workerRate} setRate={setWorkerRate} deduction />
            <ContributionRow label={text.employerContribution} value={result.employer} rate={employerRate} setRate={setEmployerRate} />
            <ResultRow label={text.taxableSalary} value={formatMoney(result.taxable)} />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-2 sm:px-5">
            {taxBrackets.map((bracket, index) => <TaxRow key={bracket.label} label={bracket.label} rate={bracket.rate ? `${bracket.rate}${text.percentSymbol}` : undefined} value={result.bracketTaxes[index]} deduction={bracket.rate > 0} />)}
            <div className="row border-t border-slate-200"><span className="row-label font-semibold text-slate-800">{text.totalTax}</span><span className="row-value text-rose-600">−{formatMoney(result.tax)}</span></div>
          </div>
        </section>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-400">{text.subtitle}</footer>
    </div>
  </main>;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return <div className="row"><span className="row-label">{label}</span><span className="row-value">{value}</span></div>;
}

function ContributionRow({ label, value, rate, setRate, deduction = false }: ContributionRowProps) {
  return <div className="row flex-wrap sm:flex-nowrap">
    <div className="min-w-[160px] flex-1"><p className="row-label">{label}</p><p className={`mt-1 text-xs font-medium ${deduction ? "text-rose-600" : "text-slate-500"}`}>{formatMoney(value)}</p></div>
    <Stepper value={rate} onChange={setRate} label={label.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} />
  </div>;
}

function TaxRow({ label, rate, value, deduction = false }: TaxRowProps) {
  return <div className="row py-3"><span className="text-sm text-slate-500">{label}{rate && <span className="ml-2 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{rate}</span>}</span><span className={`row-value ${deduction ? 'text-rose-600' : 'text-slate-400'}`}>{formatMoney(value)}</span></div>;
}
