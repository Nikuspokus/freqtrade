import { useRuntimeConfig } from 'nuxt/app'
import { ref, onMounted, onUnmounted } from 'vue'

export interface Trade {
  trade_id: number
  pair: string
  open_date: string
  close_date?: string
  open_rate: number
  close_rate?: number
  current_rate?: number
  current_profit_pct?: number // Open trades
  close_profit_pct?: number   // Closed trades
  profit_abs: number
  stake_amount: number
  stop_loss_pct: number
  initial_stop_loss_pct: number
  exit_reason?: string
}

export interface BotStatus {
  state: 'running' | 'stopped' | 'reload_config'
  dry_run: boolean
  bid_strategy: any
}

export const useFreqtrade = () => {
  const isConnected = ref(false)
  const isLoading = ref(false)
  const botState = ref<BotStatus | null>(null)
  const openTrades = ref<Trade[]>([])
  const tradeHistory = ref<Trade[]>([])
  const balance = ref(0)
  const profit = ref<any>({})

  let pollingInterval: any = null

  const fetchStatus = async () => {
    try {
      // In Demo mode or if not configured, use mock data
      const config = useRuntimeConfig()
      if (config.public.demoMode) {
        return loadMockData()
      }

      const data: any = await $fetch('/api/freqtrade/status')
      isConnected.value = true
    } catch (error) {
      console.error('Failed to fetch Freqtrade status:', error)
      isConnected.value = false
    }
  }

  const fetchTrades = async () => {
    try {
      const config = useRuntimeConfig()
      if (config.public.demoMode) {
        tradeHistory.value = [
          {
            trade_id: 10,
            pair: 'BTC/USDT',
            open_date: '2024-05-19T10:00:00Z',
            close_date: '2024-05-19T15:00:00Z',
            open_rate: 64000,
            close_rate: 66000,
            profit_pct: 0.0312,
            profit_abs: 3.12,
            stake_amount: 100,
            stop_loss_pct: -0.05,
            initial_stop_loss_pct: -0.05
          },
          {
            trade_id: 11,
            pair: 'LTC/USDT',
            open_date: '2024-05-18T08:00:00Z',
            close_date: '2024-05-18T12:00:00Z',
            open_rate: 82,
            close_rate: 78,
            profit_pct: -0.0487,
            profit_abs: -4.87,
            stake_amount: 100,
            stop_loss_pct: -0.05,
            initial_stop_loss_pct: -0.05
          }
        ]
        return
      }
      const data: any = await $fetch('/api/freqtrade/trades')
      tradeHistory.value = data.trades
    } catch (error) {
      console.error('Failed to fetch Freqtrade trades:', error)
    }
  }

  const loadMockData = () => {
    isConnected.value = true
    botState.value = { state: 'running', dry_run: true, bid_strategy: {} }
    openTrades.value = [
      {
        trade_id: 1,
        pair: 'BTC/USDT',
        open_date: '2024-05-20 10:00:00',
        open_rate: 65000,
        current_rate: 67200,
        current_profit_pct: 3.38,
        profit_abs: 0.67,
        stake_amount: 20,
        stop_loss_pct: -5.0,
        initial_stop_loss_pct: -5.0
      },
      {
        trade_id: 2,
        pair: 'ETH/USDT',
        open_date: '2024-05-20 11:30:00',
        open_rate: 3500,
        current_rate: 3450,
        current_profit_pct: -1.42,
        profit_abs: -0.28,
        stake_amount: 20,
        stop_loss_pct: -5.0,
        initial_stop_loss_pct: -5.0
      }
    ]
    balance.value = 20.39
  }

  const startPolling = (intervalMs = 5000) => {
    stopPolling()
    fetchStatus()
    pollingInterval = setInterval(fetchStatus, intervalMs)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  return {
    isConnected,
    isLoading,
    botState,
    openTrades,
    tradeHistory,
    balance,
    profit,
    fetchStatus,
    fetchTrades,
    startPolling,
    stopPolling
  }
}
