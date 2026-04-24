<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold font-mono uppercase tracking-tight">MARKET SIGNALS</h2>
        <p class="text-xs text-[var(--text-secondary)] uppercase">Detection based on RSI (14), MACD (12,26,9) and EMA</p>
      </div>
      <button @click="fetchSignals" class="btn btn-secondary flex items-center gap-2">
        <span class="i-lucide-refresh-cw w-4 h-4"></span>
        Refresh Signals
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="signal in signals" :key="signal.pair" class="card space-y-4 flex flex-col">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded bg-[var(--bg-tertiary)] flex items-center justify-center font-bold text-xs">
              {{ signal.pair.split('/')[0] }}
            </div>
            <div>
              <p class="font-bold font-mono">{{ signal.pair }}</p>
              <p class="text-[10px] text-[var(--text-muted)]">{{ signal.suggestedEntry.toFixed(2) }} USDT</p>
            </div>
          </div>
          <div :class="[
            'badge',
            signal.type === 'BUY' ? 'badge-green' : signal.type === 'SELL' ? 'badge-red' : 'badge-yellow'
          ]">
            {{ signal.type }} {{ signal.strength }}
          </div>
        </div>

        <div class="space-y-2 flex-1">
          <p class="text-xs text-[var(--text-secondary)] italic">"{{ signal.reason }}"</p>
          
          <!-- Confidence Bar -->
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-mono">
              <span>CONFIDENCE</span>
              <span>{{ signal.confidence }}%</span>
            </div>
            <div class="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div class="bg-[var(--blue)] progress-fill" :style="{ '--percent': `${signal.confidence || 0}%` }"></div>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-[var(--border)] space-y-4">
          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--text-muted)]">
            <div class="flex justify-between">
              <span>TARGET:</span>
              <span class="text-[var(--green)]">+{{ signal.targetProfit }}%</span>
            </div>
            <div class="flex justify-between">
              <span>STOP LOSS:</span>
              <span class="text-[var(--red)]">-{{ signal.stopLoss }}%</span>
            </div>
          </div>

          <button 
            @click="confirmBuy(signal)" 
            :disabled="signal.confidence < 60 || signal.type !== 'BUY'"
            class="btn w-full flex items-center justify-center gap-2"
            :class="signal.confidence >= 60 && signal.type === 'BUY' ? 'btn-success' : 'btn-secondary'"
          >
            <span v-if="signal.type === 'BUY'">EXECUTE BUY ORDER</span>
            <span v-else>NO CLEAR SIGNAL</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Buy Modal -->
    <div v-if="showBuyModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-md w-full space-y-6">
        <div class="flex items-center gap-3 text-[var(--blue)]">
          <span class="i-lucide-shopping-cart w-6 h-6"></span>
          <h3 class="text-xl font-bold font-mono uppercase">Confirm Buy Order</h3>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[var(--text-muted)] uppercase">Pair</label>
              <p class="font-mono font-bold">{{ selectedSignal?.pair }}</p>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[var(--text-muted)] uppercase">Stake Amount</label>
              <p class="font-mono font-bold">10.00 USDT</p>
            </div>
          </div>

          <div class="bg-[var(--bg-tertiary)] p-4 rounded font-mono text-xs space-y-2 border border-[var(--border)]">
            <div class="flex justify-between">
              <span>Entry Price:</span>
              <span>~{{ selectedSignal?.suggestedEntry.toFixed(4) }}</span>
            </div>
            <div class="flex justify-between text-[var(--green)]">
              <span>Take Profit (+{{ selectedSignal?.targetProfit }}%):</span>
              <span>~{{ (selectedSignal?.suggestedEntry * (1 + selectedSignal?.targetProfit/100)).toFixed(4) }}</span>
            </div>
            <div class="flex justify-between text-[var(--red)]">
              <span>Stop Loss (-{{ selectedSignal?.stopLoss }}%):</span>
              <span>~{{ (selectedSignal?.suggestedEntry * (1 - selectedSignal?.stopLoss/100)).toFixed(4) }}</span>
            </div>
          </div>

          <div class="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-200">
            <span class="i-lucide-info w-4 h-4 mt-0.5 shrink-0"></span>
            <p>This action will place a market buy order on Binance via Freqtrade. Ensure your bot is in DRY-RUN mode if testing.</p>
          </div>
        </div>

        <div class="flex gap-4">
          <button @click="showBuyModal = false" class="btn btn-secondary flex-1">CANCEL</button>
          <button @click="executeBuy" class="btn btn-primary flex-1">CONFIRM ORDER</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSignals } from '../composables/useSignals'

const { signals, fetchSignals } = useSignals()

const showBuyModal = ref(false)
const selectedSignal = ref<any>(null)

const confirmBuy = (signal: any) => {
  selectedSignal.value = signal
  showBuyModal.value = true
}

const executeBuy = () => {
  console.log('Buying', selectedSignal.value.pair)
  showBuyModal.value = false
  alert(`Order placed for ${selectedSignal.value.pair}. Check Dashboard for progress.`)
}

onMounted(() => {
  fetchSignals()
})
</script>
