export type CalculationMode = "bruto-neto" | "neto-bruto";

export interface CalculationResult {
  bruto: number;
  worker: number;
  employer: number;
  taxable: number;
  bracketTaxes: number[];
  tax: number;
  neto: number;
}

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  minimum: number;
  maximum: number;
}

export interface TaxRowProps {
  label: string;
  rate?: string;
  value: number;
  deduction?: boolean;
}

export interface TaxBracket {
  label: string;
  minimum: number;
  maximum: number | null;
  rate: number;
}

export interface CalculatorData {
  metadata: {
    title: string;
    description: string;
  };
  locale: string;
  currency: {
    symbol: string;
    decimalPlaces: number;
  };
  input: {
    placeholder: string;
    minimum: number;
    step: number;
  };
  calculation: {
    defaultMode: CalculationMode;
    grossSearchMultiplier: number;
    grossSearchMinimum: number;
    iterations: number;
  };
  text: Record<string, string>;
  modes: Array<{ value: CalculationMode; label: string }>;
  contributions: {
    minimum: number;
    maximum: number;
    workerDefault: number;
    employerDefault: number;
  };
  taxBrackets: TaxBracket[];
}
