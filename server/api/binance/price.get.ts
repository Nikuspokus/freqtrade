import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pair = (query.pair as string || 'BTC/USDT').replace('/', '')

  try {
    // Public Binance API for ticker price (no keys needed)
    const data: any = await $fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`)
    
    return {
      pair: query.pair || 'BTC/USDT',
      price: parseFloat(data.price),
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('Binance Price Proxy Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch price from Binance'
    })
  }
})
