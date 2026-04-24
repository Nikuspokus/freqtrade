import { ref, onMounted, onUnmounted } from 'vue'

export const useBinancePrice = (pair = 'BTC/USDT') => {
  const price = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let timer: any = null

  const fetchPrice = async () => {
    try {
      const data: any = await $fetch(`/api/binance/price?pair=${pair}`)
      price.value = data.price
      error.value = null
    } catch (e) {
      error.value = 'Failed to sync with Binance'
      console.error(e)
    }
  }

  const startPolling = (interval = 5000) => {
    stopPolling()
    fetchPrice()
    timer = setInterval(fetchPrice, interval)
  }

  const stopPolling = () => {
    if (timer) clearInterval(timer)
  }

  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    price,
    isLoading,
    error,
    fetchPrice
  }
}
