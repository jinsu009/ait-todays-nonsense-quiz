const koreanClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

export function quizWindow(now: Date) {
  const parts = koreanClock.formatToParts(now)
  const value = (name: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === name)?.value)
  const hour = value('hour')
  const preparing = hour < 6
  const day = Date.UTC(value('year'), value('month') - 1, value('day') - Number(preparing))

  return {
    date: new Date(day).toISOString().slice(0, 10),
    day,
    preparing,
    phase: hour >= 6 && hour < 20 ? 'answering' : 'results',
  } as const
}
