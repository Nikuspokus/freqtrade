import { ref } from 'vue'

export interface GridConfig {
  pair: string
  capital: number
  rangePct: number
  levels: number
  stopLossPct: number
  takeProfitPct: number
  mode: 'dry' | 'live'
}

export interface GridLevel {
  price: number
  type: 'buy' | 'sell'
  status: 'pending' | 'executed' | 'cancelled'
}

export interface ActiveGrid {
  id: string
  pair: string
  config: GridConfig
  levels: GridLevel[]
  currentPrice: number
  totalProfit: number
  totalTrades: number
  status: 'running' | 'stopped' | 'completed'
  startedAt: string
}

export const useGridTrading = () => {
  const activeGrids = ref<ActiveGrid[]>([])
  const isCreating = ref(false)

  const calculateLevels = (config: GridConfig, currentPrice: number): GridLevel[] => {
    const levels: GridLevel[] = []
    const rangeAmount = currentPrice * (config.rangePct / 100)
    const step = (rangeAmount * 2) / config.levels

    for (let i = 0; i <= config.levels; i++) {
      const price = (currentPrice - rangeAmount) + (step * i)
      levels.push({
        price: Math.round(price * 100) / 100,
        type: price < currentPrice ? 'buy' : 'sell',
        status: 'pending'
      })
    }

    return levels.sort((a, b) => b.price - a.price)
  }

  const launchGrid = async (config: GridConfig) => {
    isCreating.value = true
    try {
      // Simulation of Freqtrade call
      await new Promise(resolve => setTimeout(resolve, 1500))

      const priceData: any = await $fetch(`/api/binance/price?pair=${config.pair}`)
      const currentPrice = priceData.price

      const newGrid: ActiveGrid = {
        id: Math.random().toString(36).substr(2, 9),
        pair: config.pair,
        config,
        levels: calculateLevels(config, currentPrice),
        currentPrice,
        totalProfit: 0,
        totalTrades: 0,
        status: 'running',
        startedAt: new Date().toISOString()
      }

      activeGrids.value.push(newGrid)
      localStorage.setItem('freqdash_grids', JSON.stringify(activeGrids.value))
      return newGrid
    } finally {
      isCreating.value = false
    }
  }

  const stopGrid = (id: string) => {
    const grid = activeGrids.value.find(g => g.id === id)
    if (grid) {
      grid.status = 'stopped'
      localStorage.setItem('freqdash_grids', JSON.stringify(activeGrids.value))
    }
  }

  return {
    activeGrids,
    isCreating,
    calculateLevels,
    launchGrid,
    stopGrid
  }
}
