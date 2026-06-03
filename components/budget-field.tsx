"use client";

import { useState } from "react";
import { PriceInput } from "./price-input";

type Props = {
  defaultValue?: number;
  label?: string;
};

export function BudgetField({ defaultValue = 1_500_000, label = "Budget" }: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label>
      {label}
      <PriceInput name="estimatedBudget" value={value} onChange={setValue} required placeholder="1.500.000" />
    </label>
  );
}
