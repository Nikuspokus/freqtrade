<template>
  <div class="flex items-center gap-2 px-3 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
    <div class="w-2 h-2 rounded-full" :class="statusColor"></div>
    <span class="text-[10px] font-bold font-mono uppercase tracking-widest">
      Binance: {{ statusLabel }}
    </span>
    <span v-if="price" class="text-[10px] font-mono text-[var(--blue)] border-l border-[var(--border)] pl-2 ml-1">
      {{ price.toLocaleString() }} USDT
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBinancePrice } from '~/composables/useBinancePrice'

const { price, error } = useBinancePrice('BTC/USDT')

const statusLabel = computed(() => {
  if (error.value) return 'OFFLINE'
  if (price.value) return 'CONNECTED'
  return 'CONNECTING...'
})

const statusColor = computed(() => {
  if (error.value) return 'bg-[var(--red)] shadow-[0_0_8px_var(--red)]'
  if (price.value) return 'bg-[var(--green)] shadow-[0_0_8px_var(--green)] animate-pulse'
  return 'bg-[var(--yellow)]'
})
</script>
