import calculatorData from "@/data/calculator.json";

export type CalculationMode = "brutoToNeto" | "netoToBruto";

export interface SalaryBreakdown {
  bruto: number;
  kontributiPunetori: number;
  kontributiPunedhensi: number;
  pagaETatueshme: number;
  tatimi1: number;
  tatimi2: number;
  tatimiTotal: number;
  neto: number;
}

export const EMPTY_BREAKDOWN: SalaryBreakdown = {
  bruto: 0,
  kontributiPunetori: 0,
  kontributiPunedhensi: 0,
  pagaETatueshme: 0,
  tatimi1: 0,
  tatimi2: 0,
  tatimiTotal: 0,
  neto: 0,
};

export function llogaritTatimin(paga: number) {
  const taxes = calculatorData.taxBrackets.map((bracket) => {
    const upperBound = bracket.maximum ?? paga;
    const taxableAmount = Math.max(0, Math.min(paga, upperBound) - bracket.minimum);
    return taxableAmount * (bracket.ratePercent / 100);
  });

  const tatimi1 = taxes[1] ?? 0;
  const tatimi2 = taxes[2] ?? 0;
  const tatimi = taxes.reduce((total, tax) => total + tax, 0);

  return { tatimi1, tatimi2, tatimi };
}

export function brutoToNeto(
  bruto: number,
  kontributiPunetoriPct: number,
  kontributiPunedhensiPct: number
): SalaryBreakdown {
  if (!bruto || bruto < 0) {
    return EMPTY_BREAKDOWN;
  }

  const kontributiPunetori = bruto * (kontributiPunetoriPct / 100);
  const kontributiPunedhensi = bruto * (kontributiPunedhensiPct / 100);
  const pagaETatueshme = bruto - Number(kontributiPunetori.toFixed(2));

  const tatimi = llogaritTatimin(pagaETatueshme);
  const neto = pagaETatueshme - tatimi.tatimi;

  return {
    bruto,
    kontributiPunetori,
    kontributiPunedhensi,
    pagaETatueshme,
    tatimi1: tatimi.tatimi1,
    tatimi2: tatimi.tatimi2,
    tatimiTotal: tatimi.tatimi,
    neto,
  };
}

export function netoToBruto(
  targetNeto: number,
  kontributiPunetoriPct: number,
  kontributiPunedhensiPct: number
): SalaryBreakdown {
  if (!targetNeto || targetNeto < 0) {
    return EMPTY_BREAKDOWN;
  }

  let low = 0;
  let high = targetNeto * 2;
  let bruto = 0;

  while (high - low > 0.01) {
    bruto = (low + high) / 2;

    const kontributiPunetori = bruto * (kontributiPunetoriPct / 100);
    const pagaETatueshme = bruto - Number(kontributiPunetori.toFixed(2));

    const tatimi = llogaritTatimin(pagaETatueshme);
    const neto = pagaETatueshme - tatimi.tatimi;

    if (neto < targetNeto) {
      low = bruto;
    } else {
      high = bruto;
    }
  }

  const kontributiPunetori = bruto * (kontributiPunetoriPct / 100);
  const kontributiPunedhensi = bruto * (kontributiPunedhensiPct / 100);
  const pagaETatueshme = bruto - Number(kontributiPunetori.toFixed(2));

  const tatimi = llogaritTatimin(pagaETatueshme);

  return {
    bruto,
    kontributiPunetori,
    kontributiPunedhensi,
    pagaETatueshme,
    tatimi1: tatimi.tatimi1,
    tatimi2: tatimi.tatimi2,
    tatimiTotal: tatimi.tatimi,
    neto: targetNeto,
  };
}

export function formatCurrency(value: number): string {
  return `${calculatorData.currency.symbol}${Number(value).toFixed(
    calculatorData.currency.decimals
  )}`;
}

export function calculateSalary(
  amount: number,
  mode: CalculationMode,
  kontributiPunetoriPct: number,
  kontributiPunedhensiPct: number
): SalaryBreakdown {
  return mode === "brutoToNeto"
    ? brutoToNeto(amount, kontributiPunetoriPct, kontributiPunedhensiPct)
    : netoToBruto(amount, kontributiPunetoriPct, kontributiPunedhensiPct);
}
