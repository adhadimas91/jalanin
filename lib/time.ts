export function parseActivityTime(time: string): { hour: number; minute: number } {
  const normalized = time.trim().replace(":", ".");
  const match = normalized.match(/^(\d{1,2})\.(\d{1,2})$/);

  if (match) {
    return {
      hour: clampHour(Number(match[1])),
      minute: clampMinute(Number(match[2])),
    };
  }

  return { hour: 9, minute: 0 };
}

export function formatActivityTime(hour: number, minute: number) {
  return `${String(clampHour(hour)).padStart(2, "0")}.${String(clampMinute(minute)).padStart(2, "0")}`;
}

function clampHour(value: number) {
  if (!Number.isFinite(value)) return 9;
  return Math.min(23, Math.max(0, Math.floor(value)));
}

function clampMinute(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(59, Math.max(0, Math.floor(value)));
}
