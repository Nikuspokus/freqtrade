import { ref } from 'vue'
import { RSI, MACD } from 'technicalindicators'
import { useRuntimeConfig } from 'nuxt/app'

export interface Signal {
  pair: string
  type: 'BUY' | 'SELL' | 'NEUTRAL'
  strength: 'STRONG' | 'MODERATE' | 'WEAK'
  reason: string
  confidence: number
  suggestedEntry: number
  targetProfit: number
  stopLoss: number
}

export const useSignals = () => {
  const signals = ref<Signal[]>([])

  const calculateSignal = (pair: string, prices: number[]) => {
    if (prices.length < 50) return null

    const rsiValues = RSI.calculate({ values: prices, period: 14 })
    const macdValues = MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    })

    const lastRsi = rsiValues[rsiValues.length - 1]
    const lastMacd = macdValues[macdValues.length - 1]
    const currentPrice = prices[prices.length - 1]

    let type: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
    let confidence = 0
    let reason = ''

    // BUY LOGIC
    if (lastRsi < 30 && lastMacd.histogram! > 0) {
      type = 'BUY'
      strength = 'STRONG'
      confidence = 85
      reason = `RSI oversold (${lastRsi.toFixed(0)}) + MACD crossover haussier`
    } else if (lastRsi < 40) {
      type = 'BUY'
      strength = 'MODERATE'
      confidence = 65
      reason = `RSI approaching oversold (${lastRsi.toFixed(0)})`
    }

    // SELL LOGIC
    if (lastRsi > 70) {
      type = 'SELL'
      strength = 'STRONG'
      confidence = 90
      reason = `RSI overbought (${lastRsi.toFixed(0)})`
    }

    return {
      pair,
      type,
      strength,
      reason,
      confidence,
      suggestedEntry: currentPrice,
      targetProfit: 8,
      stopLoss: 3
    }
  }

  const fetchSignals = async () => {
    const config = useRuntimeConfig()
    if (config.public.demoMode) {
      loadMockSignals()
      return
    }

    try {
      isLoading.value = true

      // 1. Get the current whitelist from the bot
      const whitelist: any = await $fetch('/api/freqtrade/whitelist')
      const pairs = whitelist.method.includes('StaticPairList') ? whitelist.whitelist : whitelist.whitelist.slice(0, 10)

      const detectedSignals: Signal[] = []

      // 2. For each pair, fetch candles and detect signal
      // We limit to 5-10 pairs to avoid overloading the API
      for (const pair of pairs.slice(0, 8)) {
        try {
          const candleData: any = await $fetch(`/api/freqtrade/pair_candles?pair=${pair}&timeframe=5m&limit=50`)
          if (candleData && candleData.candles) {
            const signal = detectSignal(pair, candleData.candles)
            if (signal) detectedSignals.push(signal)
          }
        } catch (e) {
          console.warn(`Could not fetch candles for ${pair}`)
        }
      }

      signals.value = detectedSignals
    } catch (error) {
      console.error('Failed to fetch real signals:', error)
      loadMockSignals() // Fallback to mock if API fails
    } finally {
      isLoading.value = false
    }
  }

  const loadMockSignals = () => {
    signals.value = [
      {
        pair: 'BTC/USDT',
        type: 'BUY',
        strength: 'STRONG',
        confidence: 85,
        reason: 'RSI oversold + MACD Bullish Cross',
        targetProfit: 4.5,
        stopLoss: 1.5
      },
      // ... (autres mocks)
    ]
  }

  return {
    signals,
    fetchSignals,
    calculateSignal
  }
}
