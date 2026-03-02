export function formatSalary(min?: number, max?: number, currency?: string) {
  if (min === undefined && max === undefined) {
    return "Salary not listed"
  }
  const unit = currency ?? "USD"
  if (min !== undefined && max !== undefined) {
    return `${min.toLocaleString()} - ${max.toLocaleString()} ${unit}`
  }
  return `${(max ?? min ?? 0).toLocaleString()} ${unit}`
}