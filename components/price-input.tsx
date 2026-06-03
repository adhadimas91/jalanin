import { formatPriceInput, parsePriceInput } from "@/lib/format";

type Props = {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
};

export function PriceInput({ value, onChange, placeholder = "0", id, name, required }: Props) {
  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        value={formatPriceInput(value)}
        onChange={(event) => onChange(parsePriceInput(event.target.value))}
      />
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
    </>
  );
}
