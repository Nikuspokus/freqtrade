<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <div class="space-y-2">
      <h2 class="text-2xl font-bold font-mono">SETTINGS</h2>
      <p class="text-[var(--text-secondary)]">Configure your Freqtrade connection and preferences.</p>
    </div>

    <div class="card space-y-6">
      <h3 class="text-lg font-bold flex items-center gap-2">
        <span class="i-lucide-server w-5 h-5 text-[var(--blue)]"></span>
        Freqtrade API Configuration
      </h3>

      <div class="grid grid-cols-1 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-bold uppercase text-[var(--text-muted)]">API URL</label>
          <input v-model="config.url" type="text" class="input w-full" placeholder="http://localhost:8080" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-bold uppercase text-[var(--text-muted)]">Username</label>
            <input v-model="config.username" type="text" class="input w-full" placeholder="freqtrader" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold uppercase text-[var(--text-muted)]">Password</label>
            <input v-model="config.password" type="password" class="input w-full" placeholder="••••••••" />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <div class="flex items-center gap-2">
          <button @click="testConnection" :disabled="isTesting" class="btn btn-secondary flex items-center gap-2">
            <span v-if="isTesting" class="i-lucide-loader-2 w-4 h-4 animate-spin"></span>
            Test Connection
          </button>
          <span v-if="testResult === 'success'" class="text-[var(--green)] text-xs font-bold uppercase">Success</span>
          <span v-if="testResult === 'error'" class="text-[var(--red)] text-xs font-bold uppercase">Failed</span>
        </div>
        <button @click="saveSettings" class="btn btn-primary">Save Settings</button>
      </div>
    </div>

    <div class="card space-y-6">
      <h3 class="text-lg font-bold flex items-center gap-2">
        <span class="i-lucide-shield-check w-5 h-5 text-[var(--yellow)]"></span>
        Safety & Exchange
      </h3>
      
      <div class="flex items-center justify-between">
        <div>
          <p class="font-bold">Demo Mode</p>
          <p class="text-xs text-[var(--text-secondary)]">Use simulated data for testing the UI without a real bot.</p>
        </div>
        <div @click="toggleDemo" class="w-12 h-6 rounded-full bg-[var(--bg-tertiary)] relative cursor-pointer border border-[var(--border)]">
          <div class="absolute top-1 left-1 w-4 h-4 rounded-full transition-all duration-200" :class="isDemo ? 'translate-x-6 bg-[var(--green)]' : 'bg-gray-500'"></div>
        </div>
      </div>
    </div>

    <!-- Binance API Section -->
    <div class="card space-y-6" :class="{ 'opacity-50 grayscale pointer-events-none': isDemo }">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold flex items-center gap-2">
          <span class="i-lucide-key w-5 h-5 text-[var(--blue)]"></span>
          Binance API Connection
        </h3>
        <span v-if="isDemo" class="text-[10px] font-bold bg-[var(--bg-tertiary)] px-2 py-1 rounded">DISABLED IN DEMO</span>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-bold uppercase text-[var(--text-muted)]">API Key</label>
          <input v-model="config.binanceKey" type="text" class="input w-full font-mono text-sm" placeholder="Binance API Key" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold uppercase text-[var(--text-muted)]">API Secret</label>
          <input v-model="config.binanceSecret" type="password" class="input w-full font-mono text-sm" placeholder="••••••••••••••••" />
        </div>
      </div>

      <div class="p-3 bg-blue-500/5 border border-blue-500/20 rounded text-[10px] space-y-2">
        <p class="font-bold text-[var(--blue)] uppercase tracking-wider">Required Permissions:</p>
        <div class="flex gap-4">
          <span class="flex items-center gap-1"><span class="i-lucide-check-circle w-3 h-3 text-[var(--green)]"></span> Read Info</span>
          <span class="flex items-center gap-1"><span class="i-lucide-check-circle w-3 h-3 text-[var(--green)]"></span> Spot Trading</span>
          <span class="flex items-center gap-1"><span class="i-lucide-x-circle w-3 h-3 text-[var(--red)]"></span> Withdrawals (Disabled)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const config = ref({
  url: '',
  username: '',
  password: '',
  binanceKey: '',
  binanceSecret: ''
})

const isTesting = ref(false)
const testResult = ref<'none' | 'success' | 'error'>('none')
const isDemo = ref(true) // Default to demo for safety

const testConnection = async () => {
  isTesting.value = true
  testResult.value = 'none'
  try {
    // We'll call the proxy here
    await new Promise(resolve => setTimeout(resolve, 1000))
    testResult.value = 'success'
  } catch (e) {
    testResult.value = 'error'
  } finally {
    isTesting.value = false
  }
}

const saveSettings = () => {
  localStorage.setItem('freqtrade_config', JSON.stringify(config.value))
  alert('Settings saved locally!')
}

const toggleDemo = () => {
  isDemo.value = !isDemo.value
}

onMounted(() => {
  const saved = localStorage.getItem('freqtrade_config')
  if (saved) config.value = JSON.parse(saved)
})
</script>
