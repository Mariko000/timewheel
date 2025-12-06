export function subtractMinutes(timeStr, minutes) {
    const [h, m] = timeStr.split(":").map(Number)
    const d = new Date()
    d.setHours(h)
    d.setMinutes(m - minutes)
    const hh = String(d.getHours()).padStart(2,"0")
    const mm = String(d.getMinutes()).padStart(2,"0")
    return `${hh}:${mm}`
  }
  