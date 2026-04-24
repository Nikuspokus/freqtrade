<template>
  <div class="space-y-6">
    <!-- Top Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card space-y-1">
        <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Available Balance</p>
        <p class="text-2xl font-bold font-mono">{{ balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}</p>
      </div>
      <div class="card space-y-1">
        <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total P&L (24h)</p>
        <p class="text-2xl font-bold font-mono text-[var(--green)]">+€12.45 <span class="text-xs font-normal">(+1.2%)</span></p>
      </div>
      <div class="card space-y-1">
        <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Open Trades</p>
        <p class="text-2xl font-bold font-mono">{{ openTrades.length }} / 5</p>
      </div>
      <div class="card space-y-1 border-l-4 border-l-[var(--green)]">
        <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active Strategy</p>
        <p class="text-lg font-bold font-mono truncate">EMA_Crossover_v4</p>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Open Trades Section -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)]">OPEN TRADES</h3>
          <span class="text-[10px] text-[var(--text-muted)]">POLLING EVERY 5s</span>
        </div>

        <div v-if="openTrades.length === 0" class="card flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
          <span class="i-lucide-activity w-12 h-12 mb-2 opacity-20"></span>
          <p>No active trades at the moment.</p>
        </div>

        <div v-for="trade in openTrades" :key="trade.trade_id" class="card group hover:border-[var(--blue)] transition-colors relative overflow-hidden animate-slide-up">
          <!-- Profit Progress Bar background -->
          <div class="absolute bottom-0 left-0 h-1 bg-[var(--green)] opacity-20 progress-fill" :style="{ '--percent': `${Math.min(Math.max(trade.current_profit_pct || 0, 0), 100)}%` }"></div>
          
          <div class="flex items-center justify-between relative z-10">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded bg-[var(--bg-tertiary)] flex items-center justify-center font-bold text-xs">
                {{ trade.pair.split('/')[0] }}
              </div>
              <div>
                <p class="font-bold font-mono">{{ trade.pair }}</p>
                <p class="text-[10px] text-[var(--text-muted)] uppercase">ENTRY: {{ trade.open_rate }}</p>
              </div>
            </div>

            <div class="text-right">
              <p class="text-lg font-bold font-mono animate-pulse-soft" :class="(trade.current_profit_pct || 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'">
                {{ (trade.current_profit_pct || 0) >= 0 ? '+' : '' }}{{ (trade.current_profit_pct || 0).toFixed(2) }}%
              </p>
              <p class="text-[10px] font-mono text-[var(--text-muted)]">{{ (trade.profit_abs).toFixed(2) }} USDT</p>
            </div>

            <div class="flex items-center gap-2">
              <button @click="confirmSell(trade)" class="btn btn-danger py-1 px-3 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                FORCE SELL
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: Performance & Logs -->
      <div class="space-y-6">
        <div class="card space-y-4">
          <h3 class="text-xs font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)]">24H PERFORMANCE</h3>
          <div class="h-32 bg-[var(--bg-tertiary)] rounded flex items-end p-2 gap-1">
            <div v-for="i in 12" :key="i" class="bar-item" :style="{ '--h': `${Math.floor(Math.random() * 80 + 20)}%` }"></div>
          </div>
          <div class="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>24H AGO</span>
            <span>NOW</span>
          </div>
        </div>

        <div class="card space-y-2 bg-black border-none font-mono text-[10px]">
          <h3 class="text-[var(--text-muted)] uppercase mb-2">SYSTEM LOGS</h3>
          <div class="space-y-1">
            <p class="text-[var(--green)]">[INFO] Strategy started: EMA_Crossover_v4</p>
            <p class="text-[var(--text-secondary)]">[DEBUG] Fetching candles for BTC/USDT...</p>
            <p class="text-[var(--yellow)]">[WARN] High volatility detected on ETH/USDT</p>
            <p class="text-[var(--blue)]">[EXEC] Force buy order placed: 1.00 USDT on BTC/USDT</p>
            <p class="text-[var(--text-muted)]">[INFO] Waiting for next signal...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Sell Modal -->
    <div v-if="showSellModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-md w-full space-y-6 border-[var(--red)] border-2">
        <div class="flex items-center gap-3 text-[var(--red)]">
          <span class="i-lucide-alert-triangle w-6 h-6"></span>
          <h3 class="text-xl font-bold font-mono">FORCE SELL CONFIRMATION</h3>
        </div>

        <p class="text-sm">
          Are you sure you want to force sell <span class="font-bold font-mono text-[var(--blue)]">{{ selectedTrade?.pair }}</span>?
          This will execute a market order and close the position immediately.
        </p>

        <div class="bg-[var(--bg-tertiary)] p-3 rounded font-mono text-xs space-y-1">
          <div class="flex justify-between">
            <span>Current Profit:</span>
            <span :class="selectedTrade?.profit_pct >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'">
              {{ (selectedTrade?.profit_pct * 100).toFixed(2) }}%
            </span>
          </div>
          <div class="flex justify-between">
            <span>Stake Amount:</span>
            <span>{{ selectedTrade?.stake_amount }} USDT</span>
          </div>
        </div>

        <div class="flex gap-4">
          <button @click="showSellModal = false" class="btn btn-secondary flex-1">CANCEL</button>
          <button @click="executeSell" class="btn btn-danger flex-1">CONFIRM SELL</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useFreqtrade } from '../composables/useFreqtrade'

const { openTrades, balance, startPolling, stopPolling } = useFreqtrade()

const showSellModal = ref(false)
const selectedTrade = ref<any>(null)

const confirmSell = (trade: any) => {
  selectedTrade.value = trade
  showSellModal.value = true
}

const executeSell = () => {
  console.log('Selling', selectedTrade.value.trade_id)
  showSellModal.value = false
  alert(`Sold ${selectedTrade.value.pair} at market price.`)
}

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>
