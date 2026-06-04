import { formatActivityTime, parseActivityTime } from "@/lib/time";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

export function TimeInput({ value, onChange }: Props) {
  const { hour, minute } = parseActivityTime(value);

  return (
    <div className="time-input-group">
      <label className="time-input-part">
        <span>Jam</span>
        <select value={hour} onChange={(event) => onChange(formatActivityTime(Number(event.target.value), minute))}>
          {HOURS.map((option) => (
            <option key={option} value={option}>
              {String(option).padStart(2, "0")}
            </option>
          ))}
        </select>
      </label>
      <label className="time-input-part">
        <span>Menit</span>
        <select value={minute} onChange={(event) => onChange(formatActivityTime(hour, Number(event.target.value)))}>
          {MINUTES.map((option) => (
            <option key={option} value={option}>
              {String(option).padStart(2, "0")}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
