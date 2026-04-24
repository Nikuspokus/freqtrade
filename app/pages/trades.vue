<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold font-mono uppercase tracking-tight text-[var(--text-primary)]">TRADE HISTORY</h2>
      <div class="flex gap-2">
        <div class="bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-1 flex items-center gap-2">
          <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase">Win Rate:</span>
          <span class="text-sm font-bold font-mono text-[var(--green)]">68.5%</span>
        </div>
        <div class="bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-1 flex items-center gap-2">
          <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase">Avg Profit:</span>
          <span class="text-sm font-bold font-mono text-[var(--green)]">+2.4%</span>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card bg-green-500/5 border-green-500/20">
        <p class="text-[10px] font-bold text-[var(--green)] uppercase tracking-widest">Total Realized Profit</p>
        <p class="text-2xl font-bold font-mono">+€245.60</p>
      </div>
      <div class="card bg-red-500/5 border-red-500/20">
        <p class="text-[10px] font-bold text-[var(--red)] uppercase tracking-widest">Total Fees Paid</p>
        <p class="text-2xl font-bold font-mono">€12.30</p>
      </div>
      <div class="card">
        <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Best Trade</p>
        <p class="text-2xl font-bold font-mono text-[var(--green)]">+18.4% <span class="text-xs text-[var(--text-secondary)] font-normal">SOL/USDT</span></p>
      </div>
    </div>

    <!-- History Table -->
    <div class="card p-0 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-[var(--bg-tertiary)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          <tr>
            <th class="px-6 py-3">Pair</th>
            <th class="px-6 py-3">Type</th>
            <th class="px-6 py-3">Open Date</th>
            <th class="px-6 py-3">Close Date</th>
            <th class="px-6 py-3">Entry/Exit</th>
            <th class="px-6 py-3 text-right">Profit</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--border)] font-mono text-xs">
          <tr v-for="trade in tradeHistory" :key="trade.trade_id" class="hover:bg-[var(--bg-tertiary)] transition-colors">
            <td class="px-6 py-4 font-bold text-[var(--text-primary)]">{{ trade.pair }}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-0.5 rounded-full bg-blue-500/10 text-[var(--blue)] border border-blue-500/20 text-[9px] uppercase">Limit Buy</span>
            </td>
            <td class="px-6 py-4 text-[var(--text-secondary)]">{{ formatDate(trade.open_date) }}</td>
            <td class="px-6 py-4 text-[var(--text-secondary)]">{{ formatDate(trade.close_date) }}</td>
            <td class="px-6 py-4">
              <div class="space-y-0.5">
                <p>{{ trade.open_rate }}</p>
                <p class="text-[var(--text-muted)] opacity-50">{{ trade.close_rate }}</p>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <p :class="(trade.close_profit_pct || 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'" class="font-bold">
                {{ (trade.close_profit_pct || 0) >= 0 ? '+' : '' }}{{ (trade.close_profit_pct || 0).toFixed(2) }}%
              </p>
              <p class="text-[10px] text-[var(--text-muted)]">{{ (trade.profit_abs).toFixed(2) }} USDT</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFreqtrade } from '../composables/useFreqtrade'

const { tradeHistory, fetchTrades } = useFreqtrade()

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchTrades()
})
</script>
