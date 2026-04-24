<template>
  <div class="space-y-8 animate-slide-up">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold font-mono uppercase tracking-tight">GRID TRADING</h2>
        <p class="text-[var(--text-secondary)]">Automated buy/sell grids on Binance via Freqtrade.</p>
      </div>
      <button 
        v-if="!isCreating" 
        @click="showCreator = true" 
        class="btn btn-primary flex items-center gap-2"
      >
        <span class="i-lucide-plus-circle w-4 h-4"></span>
        New Grid
      </button>
    </div>

    <!-- Active Grids Section -->
    <div v-if="!showCreator" class="space-y-6">
      <div v-if="activeGrids.length === 0" class="card flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
        <div class="i-lucide-layers w-16 h-16 mb-4 opacity-10"></div>
        <p class="text-lg font-medium">No active grids at the moment.</p>
        <p class="text-sm">Create a new grid to start automated trading.</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-6">
        <GridCard 
          v-for="grid in activeGrids" 
          :key="grid.id" 
          :grid="grid" 
          @stop="stopGrid" 
        />
      </div>
    </div>

    <!-- Grid Creator Wizard -->
    <div v-else class="max-w-3xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <button @click="showCreator = false" class="text-[var(--text-muted)] hover:text-white transition-colors">
          <span class="i-lucide-arrow-left w-5 h-5"></span>
        </button>
        <h3 class="text-lg font-bold font-mono">CREATE NEW GRID</h3>
      </div>
      <GridCreator @created="onGridCreated" @cancel="showCreator = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGridTrading } from '~/composables/useGridTrading'

const { activeGrids, stopGrid } = useGridTrading()
const showCreator = ref(false)

const onGridCreated = () => {
  showCreator.value = false
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  const saved = localStorage.getItem('freqdash_grids')
  if (saved) {
    activeGrids.value = JSON.parse(saved)
  }
})
</script>
