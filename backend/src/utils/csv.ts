type CsvValue = string | number | null | undefined

function escapeField(value: CsvValue): string {
  const s = value === null || value === undefined ? "" : String(value)
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

export function generateCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeField).join(",")).join("\n")
}
