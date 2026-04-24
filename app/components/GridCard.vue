<template>
  <div class="card group hover:border-[var(--blue)] transition-all duration-300 relative overflow-hidden">
    <!-- Mode Banner -->
    <div 
      class="absolute top-0 right-0 px-4 py-1 text-[8px] font-bold uppercase tracking-widest rounded-bl z-20"
      :class="grid.config.mode === 'live' ? 'bg-[var(--red)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'"
    >
      {{ grid.config.mode === 'live' ? 'LIVE - REAL MONEY' : 'DRY RUN - SIMULATION' }}
    </div>

    <div class="flex flex-col lg:flex-row gap-6 relative z-10">
      <!-- Main Info -->
      <div class="flex-1 space-y-4">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded bg-[var(--bg-tertiary)] flex items-center justify-center font-bold text-sm">
              {{ grid.pair.split('/')[0] }}
            </div>
            <div>
              <h4 class="text-xl font-bold font-mono">{{ grid.pair }}</h4>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse"></span>
                <span class="text-[10px] text-[var(--text-muted)] uppercase font-mono tracking-widest">
                  RUNNING SINCE {{ formatDate(grid.startedAt) }}
                </span>
              </div>
            </div>
          </div>
          
          <button @click="$emit('stop', grid.id)" class="btn btn-danger py-1 px-4 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            EMERGENCY STOP
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]">
          <div class="space-y-1">
            <p class="text-[9px] text-[var(--text-muted)] uppercase font-bold">Capital</p>
            <p class="text-lg font-bold font-mono">{{ grid.config.capital }} USDT</p>
          </div>
          <div class="space-y-1 text-[var(--green)]">
            <p class="text-[9px] text-[var(--text-muted)] uppercase font-bold">Total Profit</p>
            <p class="text-lg font-bold font-mono">+{{ grid.totalProfit.toFixed(2) }} USDT</p>
          </div>
          <div class="space-y-1">
            <p class="text-[9px] text-[var(--text-muted)] uppercase font-bold">Trades</p>
            <p class="text-lg font-bold font-mono">{{ grid.totalTrades }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-[9px] text-[var(--text-muted)] uppercase font-bold">Niveaux</p>
            <p class="text-lg font-bold font-mono">{{ grid.config.levels }}</p>
          </div>
        </div>
      </div>

      <!-- Small Visualizer -->
      <div class="w-full lg:w-48 bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border)]">
        <p class="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-2 tracking-widest">Live Grid Status</p>
        <div class="flex flex-col gap-1">
          <div 
            v-for="level in sortedLevels" 
            :key="level.price"
            class="flex items-center justify-between gap-2 px-2 py-1 rounded text-[8px] font-mono"
            :class="level.status === 'executed' ? 'opacity-20' : 'bg-black/20'"
          >
            <span :class="level.type === 'buy' ? 'text-[var(--green)]' : 'text-[var(--red)]'">
              {{ level.type === 'buy' ? 'B' : 'S' }}
            </span>
            <span class="text-[var(--text-secondary)]">{{ level.price }}</span>
            <div v-if="level.status === 'executed'" class="i-lucide-check w-2 h-2 text-[var(--green)]"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type ActiveGrid } from '~/composables/useGridTrading'

const props = defineProps<{
  grid: ActiveGrid
}>()

defineEmits(['stop'])

const sortedLevels = computed(() => {
  return [...props.grid.levels].sort((a, b) => b.price - a.price)
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString()
}
</script>
