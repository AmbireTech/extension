const formatDateTime = (dateInput: Date | number) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date)

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || ''

  return `${getPart('month')}/${getPart('day')}/${getPart('year')} ${getPart('hour')}:${getPart(
    'minute'
  )}`
}

export default formatDateTime
