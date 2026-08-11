"use client";

import { useMemo, useState } from "react";
import {
  calculateSalary,
  formatCurrency,
  type CalculationMode,
  type SalaryBreakdown,
} from "@/lib/calculator";
import calculatorData from "@/data/calculator.json";

const { text, taxBrackets, contributions, currency } = calculatorData;
const MIN_KONTRIBUT = contributions.minimumPercent;
const MAX_KONTRIBUT = contributions.maximumPercent;

function Stepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-700/80 bg-zinc-800/60">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-zinc-400 transition hover:bg-zinc-700/60 hover:text-white disabled:opacity-30"
        aria-label={decreaseLabel}
        onClick={onDecrease}
        disabled={value <= MIN_KONTRIBUT}
      >
        −
      </button>
      <span className="w-10 text-center text-xs font-semibold tabular-nums text-zinc-200">
        {value}%
      </span>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-zinc-400 transition hover:bg-zinc-700/60 hover:text-white disabled:opacity-30"
        aria-label={increaseLabel}
        onClick={onIncrease}
        disabled={value >= MAX_KONTRIBUT}
      >
        +
      </button>
    </div>
  );
}

function LineItem({
  label,
  value,
  variant = "default",
  indent = false,
  badge,
}: {
  label: React.ReactNode;
  value: string;
  variant?: "default" | "deduction" | "highlight" | "muted";
  indent?: boolean;
  badge?: string;
}) {
  const valueStyles = {
    default: "text-zinc-100",
    deduction: "text-rose-400",
    highlight: "text-emerald-400",
    muted: "text-zinc-500",
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 py-2.5 ${
        indent ? "pl-4" : ""
      }`}
    >
      <span
        className={`flex items-center gap-2 text-sm ${
          variant === "muted" ? "text-zinc-500" : "text-zinc-400"
        }`}
      >
        {label}
        {badge && (
          <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
            {badge}
          </span>
        )}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${valueStyles[variant]}`}
      >
        {value}
      </span>
    </div>
  );
}

function ContributionCard({
  title,
  subtitle,
  value,
  amount,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  isDeduction = false,
}: {
  title: string;
  subtitle: string;
  value: number;
  amount: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  isDeduction?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">{title}</p>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <span
          className={`text-sm font-semibold tabular-nums ${
            isDeduction ? "text-rose-400" : "text-zinc-300"
          }`}
        >
          {amount}
        </span>
      </div>
      <Stepper
        value={value}
        onDecrease={onDecrease}
        onIncrease={onIncrease}
        decreaseLabel={decreaseLabel}
        increaseLabel={increaseLabel}
      />
    </div>
  );
}

export default function Calculator() {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<CalculationMode>("brutoToNeto");
  const [kontributiPunetori, setKontributiPunetori] = useState(MIN_KONTRIBUT);
  const [kontributiPunedhensi, setKontributiPunedhensi] = useState(MIN_KONTRIBUT);

  const breakdown: SalaryBreakdown = useMemo(() => {
    const parsed = parseFloat(amount);
    return calculateSalary(parsed, mode, kontributiPunetori, kontributiPunedhensi);
  }, [amount, mode, kontributiPunetori, kontributiPunedhensi]);

  const hasAmount = amount !== "" && parseFloat(amount) > 0;
  const heroLabel = mode === "brutoToNeto" ? text.netSalary : text.grossSalary;
  const heroValue =
    mode === "brutoToNeto"
      ? formatCurrency(breakdown.neto)
      : formatCurrency(breakdown.bruto);

  const adjustKontribut = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number
  ) => {
    setter((current) => {
      const next = current + delta;
      if (next < MIN_KONTRIBUT || next > MAX_KONTRIBUT) return current;
      return next;
    });
  };

  const modes: { id: CalculationMode; label: string }[] = [
    { id: "brutoToNeto", label: text.grossToNet },
    { id: "netoToBruto", label: text.netToGross },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {text.lawBadge}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {text.title}
          </h1>
          <p className="mt-2 text-zinc-400">
            {text.subtitle}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Input panel */}
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
              <label
                htmlFor="paga"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {mode === "brutoToNeto" ? text.grossSalary : text.netSalary}
              </label>
              <div className="flex items-center rounded-xl border border-zinc-700/80 bg-zinc-950/60 transition focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20">
                <span className="pl-4 text-xl font-semibold text-zinc-500">
                  {currency.symbol}
                </span>
                <input
                  type="number"
                  id="paga"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent py-4 pl-2 pr-4 text-3xl font-bold tabular-nums text-white outline-none placeholder:text-zinc-700"
                />
              </div>

              <div
                className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-zinc-950/60 p-1"
                role="group"
                aria-label={text.calculationType}
              >
                {modes.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      mode === id
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {text.pensionContributions}
              </p>
              <ContributionCard
                title={text.employeeContribution}
                subtitle={text.employeeContributionSubtitle}
                value={kontributiPunetori}
                amount={formatCurrency(breakdown.kontributiPunetori)}
                decreaseLabel={text.decreaseEmployeeContribution}
                increaseLabel={text.increaseEmployeeContribution}
                onDecrease={() => adjustKontribut(setKontributiPunetori, -contributions.stepPercent)}
                onIncrease={() => adjustKontribut(setKontributiPunetori, contributions.stepPercent)}
                isDeduction
              />
              <ContributionCard
                title={text.employerContribution}
                subtitle={text.employerContributionSubtitle}
                value={kontributiPunedhensi}
                amount={formatCurrency(breakdown.kontributiPunedhensi)}
                decreaseLabel={text.decreaseEmployerContribution}
                increaseLabel={text.increaseEmployerContribution}
                onDecrease={() => adjustKontribut(setKontributiPunedhensi, -contributions.stepPercent)}
                onIncrease={() => adjustKontribut(setKontributiPunedhensi, contributions.stepPercent)}
              />
            </div>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
              {/* Hero result */}
              <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 px-6 py-8 sm:px-8">
                <div
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5"
                />
                <p className="relative text-sm font-medium text-violet-200">
                  {hasAmount ? heroLabel : text.result}
                </p>
                <p className="relative mt-1 text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
                  {hasAmount ? heroValue : formatCurrency(0)}
                </p>
                {hasAmount && (
                  <p className="relative mt-2 text-sm text-violet-200/80">
                    {mode === "brutoToNeto"
                      ? `${text.fromGross} ${formatCurrency(breakdown.bruto)}`
                      : `${text.forNet} ${formatCurrency(breakdown.neto)}`}
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="divide-y divide-zinc-800/80 px-6 py-2 sm:px-8">
                <div className="py-3">
                  <LineItem
                    label={text.grossSalary}
                    value={formatCurrency(breakdown.bruto)}
                    variant="highlight"
                  />
                  <LineItem
                    label={text.taxableSalary}
                    value={formatCurrency(breakdown.pagaETatueshme)}
                  />
                </div>

                <div className="py-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    {text.incomeTax}
                  </p>
                  {taxBrackets.map((bracket, index) => (
                    <LineItem
                      key={bracket.minimum}
                      label={
                        bracket.maximum === null
                          ? `${bracket.minimum}+ ${currency.symbol}`
                          : `${bracket.minimum} – ${bracket.maximum} ${currency.symbol}`
                      }
                      value={formatCurrency(
                        index === 1
                          ? breakdown.tatimi1
                          : index === 2
                            ? breakdown.tatimi2
                            : 0
                      )}
                      variant={bracket.ratePercent === 0 ? "muted" : "deduction"}
                      indent
                      badge={`${bracket.ratePercent}%`}
                    />
                  ))}
                  <div className="mt-1 border-t border-zinc-800/60 pt-2">
                    <LineItem
                      label={text.totalTax}
                      value={formatCurrency(breakdown.tatimiTotal)}
                      variant="deduction"
                    />
                  </div>
                </div>

                <div className="py-3">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
                    <span className="text-sm font-medium text-emerald-300">
                      {text.netSalary}
                    </span>
                    <span className="text-xl font-bold tabular-nums text-emerald-400">
                      {formatCurrency(breakdown.neto)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax brackets legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
              {taxBrackets.map((bracket) => (
                <span key={bracket.minimum} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${bracket.color}`} />
                  {bracket.ratePercent}%
                </span>
              ))}
              <span className="text-zinc-700">·</span>
              <span>{text.taxBrackets}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
