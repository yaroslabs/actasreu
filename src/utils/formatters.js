import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { MEETING_TYPES, PROJECT_STATUSES, AGREEMENT_STATUSES } from './constants'

function toDate(date) {
  if (!date) return null
  if (date?.toDate) return date.toDate()
  if (typeof date === 'string') {
    const parsed = parseISO(date)
    return isValid(parsed) ? parsed : null
  }
  const d = new Date(date)
  return isValid(d) ? d : null
}

export function formatDate(date) {
  const d = toDate(date)
  if (!d) return '-'
  return format(d, 'dd MMM yyyy', { locale: es })
}

export function formatDateTime(date) {
  const d = toDate(date)
  if (!d) return '-'
  return format(d, "dd MMM yyyy 'a las' HH:mm", { locale: es })
}

export function getMeetingTypeLabel(value) {
  return MEETING_TYPES.find((t) => t.value === value)?.label || value || '-'
}

export function getProjectStatusLabel(value) {
  return PROJECT_STATUSES.find((s) => s.value === value)?.label || value || '-'
}

export function getAgreementStatusLabel(value) {
  return AGREEMENT_STATUSES.find((s) => s.value === value)?.label || value || '-'
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}
