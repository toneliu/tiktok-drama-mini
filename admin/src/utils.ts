import dayjs from 'dayjs'

export const formatDate = (value: any, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!value) return '-'
  const d = dayjs(value)
  return d.isValid() ? d.format(format) : '-'
}

export const formatDateShort = (value: any) => formatDate(value, 'YYYY-MM-DD')

export const formatNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return '0'
  const num = Number(value)
  if (isNaN(num)) return '0'
  return num.toLocaleString('zh-CN')
}

export const formatDuration = (seconds: any) => {
  if (!seconds && seconds !== 0) return '-'
  const s = Number(seconds)
  if (isNaN(s)) return '-'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export const truncate = (text: any, len = 30) => {
  if (!text) return '-'
  const str = String(text)
  return str.length > len ? str.slice(0, len) + '...' : str
}
