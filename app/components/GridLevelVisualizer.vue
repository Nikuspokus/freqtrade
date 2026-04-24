<template>
  <div class="relative bg-[var(--bg-tertiary)] rounded-lg p-6 min-h-[300px] border border-[var(--border)] overflow-hidden">
    <!-- Center Line (Current Price) -->
    <div 
      class="absolute left-0 right-0 h-px bg-[var(--blue)] opacity-50 z-20 transition-all duration-500"
      :style="{ top: '50%' }"
    >
      <div class="absolute right-0 top-0 -translate-y-1/2 bg-[var(--blue)] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg animate-pulse">
        CURRENT: {{ currentPrice?.toLocaleString() }}
      </div>
    </div>

    <!-- Grid Levels -->
    <div class="relative h-full flex flex-col justify-between">
      <div 
        v-for="level in levels" 
        :key="level.price"
        class="flex items-center gap-4 py-2 border-b border-[var(--border)] last:border-0 group hover:bg-white/5 transition-colors"
      >
        <div class="w-20 text-[10px] font-mono font-bold text-[var(--text-secondary)]">
          {{ level.price.toLocaleString() }}
        </div>
        
        <div class="flex-1 h-px bg-white/10 group-hover:bg-white/20"></div>

        <div class="flex items-center gap-2">
          <span 
            class="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter"
            :class="level.type === 'buy' ? 'bg-emerald-500/10 text-[var(--green)]' : 'bg-red-500/10 text-[var(--red)]'"
          >
            {{ level.type === 'buy' ? 'BUY LIMIT' : 'SELL LIMIT' }}
          </span>
          <div 
            class="w-1.5 h-1.5 rounded-full"
            :class="level.type === 'buy' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Info Overlay -->
    <div class="absolute bottom-2 left-2 text-[9px] text-[var(--text-muted)] font-mono uppercase">
      Grid Range: ±{{ rangePct }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { type GridLevel } from '~/composables/useGridTrading'

defineProps<{
  levels: GridLevel[]
  currentPrice: number | null
  rangePct: number
}>()
</script>
