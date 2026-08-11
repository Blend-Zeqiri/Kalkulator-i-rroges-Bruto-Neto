"use client";

import { useMemo, useState } from "react";
import calculatorJson from "@/data/calculator.json";
import type {
  CalculatorData,
  CalculationMode,
  CalculationResult,
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

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8 flex items-center gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl font-bold text-white shadow-xl shadow-slate-900/15" aria-hidden>{currency.symbol}</div>
        <div><h1 className="text-2xl font-bold tracking-[-.03em] text-slate-950 sm:text-3xl">{text.title}</h1><p className="mt-1 text-sm text-slate-500 sm:text-base">{text.subtitle}</p></div>
      </header>

      <section className="grid overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,.28)] lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative">
            <div className="mb-8 flex gap-1 rounded-xl bg-white/7 p-1" role="radiogroup" aria-label={text.calculationType}>
              {modes.map(({ value, label }) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setMode(value)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm transition-all ${mode === value ? 'bg-white font-semibold text-slate-950 shadow-lg' : 'font-medium text-slate-400 hover:text-white'}`}>{label}</button>)}
            </div>

            <label htmlFor="paga" className="mb-3 block text-xs font-semibold uppercase tracking-[.16em] text-slate-400">{text.amount}</label>
            <div className="flex items-center border-b border-white/20 pb-3 transition-colors focus-within:border-cyan-400">
              <span className="text-3xl font-semibold text-cyan-400">{currency.symbol}</span><input id="paga" type="number" inputMode="decimal" min={input.minimum} step={input.step} value={amount} onChange={e => setAmount(e.target.value)} placeholder={input.placeholder} className="min-w-0 flex-1 bg-transparent pl-3 text-4xl font-bold tracking-tight text-white outline-none placeholder:text-slate-700 sm:text-5xl" />
            </div>
            <p className="mt-3 text-sm text-slate-400">{mode === "neto-bruto" ? text.netSalary : text.grossSalary}</p>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-cyan-300">{mode === "neto-bruto" ? text.grossSalary : text.netSalary}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{formatMoney(mode === "neto-bruto" ? result.bruto : result.neto)}</p>
              <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" /></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-4 lg:p-6">
          <div className="px-4 pb-3 pt-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{text.calculationType}</p><p className="mt-1 text-lg font-bold text-slate-900">{mode === "neto-bruto" ? text.netSalary : text.grossSalary} → {mode === "neto-bruto" ? text.grossSalary : text.netSalary}</p></div>
          <div className="row rounded-xl bg-indigo-50/80"><span className="row-label text-indigo-950">{mode === "neto-bruto" ? text.netSalary : text.grossSalary}</span><span className="row-value text-indigo-700">{formatMoney(mode === "neto-bruto" ? result.neto : result.bruto)}</span></div>
          <div className="my-2 border-t border-slate-100" />

          <ContributionRow label={text.workerContribution} value={result.worker} rate={workerRate} setRate={setWorkerRate} deduction />
          <ContributionRow label={text.employerContribution} value={result.employer} rate={employerRate} setRate={setEmployerRate} />
          <div className="row"><span className="row-label text-slate-600">{text.taxableSalary}</span><span className="row-value">{formatMoney(result.taxable)}</span></div>

          <div className="mx-5 mt-3 border-t border-slate-100 pb-2 pt-5 text-xs font-bold uppercase tracking-[.16em] text-slate-400">{text.incomeTax}</div>
          {taxBrackets.map((bracket, index) => <TaxRow key={bracket.label} label={bracket.label} rate={bracket.rate ? `${bracket.rate}${text.percentSymbol}` : undefined} value={result.bracketTaxes[index]} deduction={bracket.rate > 0} />)}
          <div className="mx-5 mt-2 border-t border-slate-100" />
          <div className="row"><span className="row-label font-semibold">{text.totalTax}</span><span className="row-value text-rose-600">−{formatMoney(result.tax)}</span></div>
        </div>
      </section>
      <footer className="mt-6 text-center text-xs font-medium text-slate-400">{text.taxRates}: {taxBrackets.map(({ rate }) => `${rate}${text.percentSymbol}`).join(text.rateSeparator)}</footer>
    </div>
  </main>;
}

function ContributionRow({ label, value, rate, setRate, deduction = false }: { label: string; value: number; rate: number; setRate: (value: number) => void; deduction?: boolean }) {
  return <div className="row flex-wrap rounded-xl sm:flex-nowrap">
    <div className="min-w-[150px] flex-1"><p className="row-label text-slate-600">{label}</p><p className={`mt-0.5 text-xs font-semibold ${deduction ? "text-rose-500" : "text-slate-400"}`}>{formatMoney(value)}</p></div>
    <Stepper value={rate} onChange={setRate} label={label.toLowerCase()} minimum={contributions.minimum} maximum={contributions.maximum} />
  </div>;
}

function TaxRow({ label, rate, value, deduction = false }: TaxRowProps) {
  return <div className="row py-2.5"><span className="text-sm text-slate-500">{label}{rate && <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{rate}</span>}</span><span className={`row-value ${deduction ? 'text-rose-600' : 'text-slate-400'}`}>{formatMoney(value)}</span></div>;
}
