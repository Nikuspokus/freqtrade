<template>
  <div class="card space-y-8 min-h-[500px] flex flex-col">
    <!-- Stepper Header -->
    <div class="flex items-center justify-between px-4 border-b border-[var(--border)] pb-6">
      <div v-for="s in 4" :key="s" class="flex items-center gap-2">
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300"
          :class="step >= s ? 'bg-[var(--blue)] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'"
        >
          {{ s }}
        </div>
        <span v-if="s < 4" class="w-12 h-0.5 bg-[var(--border)]" :class="{ 'bg-[var(--blue)]': step > s }"></span>
      </div>
    </div>

    <!-- Step Content -->
    <div class="flex-1 space-y-6">
      <!-- Step 1: Pair & Capital -->
      <div v-if="step === 1" class="space-y-6 animate-slide-up">
        <h4 class="text-xl font-bold font-mono uppercase tracking-tight">Step 1: Pair & Capital</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-[var(--text-muted)] uppercase">Pair Selection</label>
              <select v-model="form.pair" class="input w-full bg-[var(--bg-tertiary)]">
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="SOL/USDT">SOL/USDT</option>
                <option value="ADA/USDT">ADA/USDT</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-[var(--text-muted)] uppercase">Capital to Allocate (USDT)</label>
              <input v-model.number="form.capital" type="number" class="input w-full" placeholder="20.00" />
              <p class="text-[10px] text-[var(--text-muted)]">Minimum recommended: 20 USDT</p>
            </div>
          </div>
          <div class="card bg-blue-500/5 border-blue-500/20 flex flex-col justify-center items-center p-6 text-center">
            <p class="text-[10px] font-bold text-[var(--blue)] uppercase mb-2">Live Price (Binance)</p>
            <p v-if="price" class="text-4xl font-bold font-mono tracking-tighter">{{ price.toLocaleString() }}</p>
            <p v-else class="text-4xl font-bold font-mono animate-pulse opacity-20">---</p>
            <p class="text-xs text-[var(--text-muted)] mt-2">USDT</p>
          </div>
        </div>
      </div>

      <!-- Step 2: Grid Configuration -->
      <div v-if="step === 2" class="space-y-6 animate-slide-up">
        <h4 class="text-xl font-bold font-mono uppercase tracking-tight">Step 2: Grid Range & Levels</h4>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="space-y-6">
            <div class="space-y-2">
              <div class="flex justify-between">
                <label class="text-xs font-bold text-[var(--text-muted)] uppercase">Range (±%)</label>
                <span class="text-sm font-bold font-mono text-[var(--blue)]">±{{ form.rangePct }}%</span>
              </div>
              <input v-model.number="form.rangePct" type="range" min="2" max="20" class="w-full h-1 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--blue)]" />
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between">
                <label class="text-xs font-bold text-[var(--text-muted)] uppercase">Number of Levels</label>
                <span class="text-sm font-bold font-mono text-[var(--blue)]">{{ form.levels }}</span>
              </div>
              <input v-model.number="form.levels" type="range" min="3" max="20" class="w-full h-1 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--blue)]" />
            </div>

            <div class="p-4 bg-[var(--bg-tertiary)] rounded space-y-2 text-xs font-mono">
              <div class="flex justify-between">
                <span>Capital/Level:</span>
                <span>{{ (form.capital / form.levels).toFixed(2) }} USDT</span>
              </div>
              <div class="flex justify-between text-[var(--green)]">
                <span>Est. Profit/Level:</span>
                <span>~{{ (form.rangePct / form.levels).toFixed(2) }}%</span>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-[var(--text-muted)] uppercase">Preview Layout</label>
            <GridLevelVisualizer :levels="previewLevels" :current-price="price" :range-pct="form.rangePct" />
          </div>
        </div>
      </div>

      <!-- Step 3: Safety & Mode -->
      <div v-if="step === 3" class="space-y-6 animate-slide-up">
        <h4 class="text-xl font-bold font-mono uppercase tracking-tight">Step 3: Security & Safety</h4>
        <div class="card border-[var(--red)] border-opacity-30 p-6 space-y-6">
          <div class="space-y-1">
            <div class="flex justify-between">
              <label class="text-xs font-bold text-[var(--red)] uppercase">Global Stop Loss (%)</label>
              <span class="text-sm font-bold font-mono text-[var(--red)]">-{{ form.stopLossPct }}%</span>
            </div>
            <input v-model.number="form.stopLossPct" type="range" min="5" max="30" class="w-full h-1 bg-red-500/10 rounded-lg appearance-none cursor-pointer accent-[var(--red)]" />
            <p class="text-[10px] text-[var(--text-muted)] mt-1">If {{ form.pair }} drops by {{ form.stopLossPct }}%, the grid will stop and all positions will be closed.</p>
          </div>

          <div class="flex items-center justify-between p-4 bg-black/40 rounded border border-[var(--border)]">
            <div>
              <p class="text-sm font-bold">Execution Mode</p>
              <p class="text-[10px] text-[var(--text-muted)] uppercase">{{ form.mode === 'dry' ? 'SIMULATION (DRY RUN)' : 'LIVE TRADING (REAL MONEY)' }}</p>
            </div>
            <div class="flex gap-2">
              <button 
                @click="form.mode = 'dry'" 
                class="px-4 py-2 rounded text-[10px] font-bold transition-all"
                :class="form.mode === 'dry' ? 'bg-[var(--blue)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'"
              >DRY RUN</button>
              <button 
                @click="form.mode = 'live'" 
                class="px-4 py-2 rounded text-[10px] font-bold transition-all"
                :class="form.mode === 'live' ? 'bg-[var(--red)] text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'"
              >LIVE</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Confirmation -->
      <div v-if="step === 4" class="space-y-6 animate-slide-up">
        <h4 class="text-xl font-bold font-mono uppercase tracking-tight">Step 4: Final Confirmation</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card space-y-4 font-mono text-xs p-6">
            <div class="flex justify-between border-b border-[var(--border)] pb-2">
              <span class="text-[var(--text-muted)]">PAIR</span>
              <span class="font-bold">{{ form.pair }}</span>
            </div>
            <div class="flex justify-between border-b border-[var(--border)] pb-2">
              <span class="text-[var(--text-muted)]">CAPITAL</span>
              <span class="font-bold text-[var(--blue)]">{{ form.capital }} USDT</span>
            </div>
            <div class="flex justify-between border-b border-[var(--border)] pb-2">
              <span class="text-[var(--text-muted)]">LEVELS</span>
              <span class="font-bold">{{ form.levels }}</span>
            </div>
            <div class="flex justify-between border-b border-[var(--border)] pb-2 text-[var(--red)]">
              <span class="text-[var(--text-muted)]">STOP LOSS</span>
              <span class="font-bold">-{{ form.stopLossPct }}%</span>
            </div>
            <div class="flex justify-between pt-4">
              <span class="text-[var(--text-muted)]">MODE</span>
              <span class="font-bold" :class="form.mode === 'live' ? 'text-[var(--red)]' : 'text-[var(--green)]'">
                {{ form.mode.toUpperCase() }}
              </span>
            </div>
          </div>

          <div class="flex flex-col justify-center space-y-4">
            <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] flex gap-3">
              <div class="i-lucide-alert-triangle w-8 h-8 text-[var(--yellow)] shrink-0"></div>
              <p>Trading cryptocurrencies involves high risk. This automated grid will execute market orders on your behalf. Ensure you have the required balance on your Binance account.</p>
            </div>
            <label class="flex items-center gap-3 p-4 bg-white/5 rounded cursor-pointer group hover:bg-white/10 transition-all">
              <input type="checkbox" v-model="confirmed" class="w-4 h-4 accent-[var(--blue)]" />
              <span class="text-xs">I understand the risks and want to launch this grid.</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Stepper Footer -->
    <div class="flex justify-between items-center pt-6 border-t border-[var(--border)]">
      <button 
        v-if="step > 1" 
        @click="step--" 
        class="btn btn-secondary flex items-center gap-2"
        :disabled="isCreating"
      >
        <span class="i-lucide-chevron-left w-4 h-4"></span>
        Previous
      </button>
      <div v-else></div>

      <button 
        v-if="step < 4" 
        @click="step++" 
        class="btn btn-primary px-8 flex items-center gap-2"
        :disabled="!canGoNext"
      >
        Next Step
        <span class="i-lucide-chevron-right w-4 h-4"></span>
      </button>
      <button 
        v-else 
        @click="handleLaunch" 
        class="btn btn-success px-8 flex items-center gap-2 relative overflow-hidden"
        :disabled="!confirmed || isCreating"
      >
        <span v-if="isCreating" class="i-lucide-loader-2 w-4 h-4 animate-spin"></span>
        <span v-else class="i-lucide-rocket w-4 h-4"></span>
        {{ isCreating ? 'Launching...' : 'LAUNCH GRID' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBinancePrice } from '~/composables/useBinancePrice'
import { useGridTrading, type GridConfig } from '~/composables/useGridTrading'

const emit = defineEmits(['created', 'cancel'])
const step = ref(1)
const confirmed = ref(false)

const form = ref<GridConfig>({
  pair: 'BTC/USDT',
  capital: 20,
  rangePct: 8,
  levels: 6,
  stopLossPct: 15,
  takeProfitPct: 20,
  mode: 'dry'
})

const { price } = useBinancePrice(form.pair)
const { calculateLevels, launchGrid, isCreating } = useGridTrading()

const previewLevels = computed(() => {
  return calculateLevels(form.value, price.value || 92450)
})

const canGoNext = computed(() => {
  if (step.value === 1) return form.value.capital >= 10
  return true
})

const handleLaunch = async () => {
  const grid = await launchGrid(form.value)
  if (grid) {
    emit('created', grid)
  }
}

// Reset confirmation on mode change
watch(() => form.value.mode, () => {
  confirmed.value = false
})
</script>
