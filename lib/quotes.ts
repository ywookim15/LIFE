export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  {
    text: 'The ones who are crazy enough to think they can change the world are the ones who do.',
    author: 'Steve Jobs',
  },
]

export function getDailyQuote(): Quote {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const dayOfYear = Math.floor(diff / 86_400_000)
  return QUOTES[dayOfYear % QUOTES.length]
}
