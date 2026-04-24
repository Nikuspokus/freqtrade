<template>
  <div class="min-h-screen flex flex-col">
    <!-- Dry Run Warning Banner -->
    <div v-if="isDryRun" class="bg-[var(--yellow)] text-black text-center py-1 text-xs font-bold uppercase tracking-widest">
      MODE SIMULATION — Aucun argent réel — Binance Testnet / Paper Trading
    </div>

    <!-- Header -->
    <header class="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold tracking-tighter text-[var(--blue)]">
          FREQ<span class="text-white">DASH</span>
        </h1>
        <nav class="hidden md:flex items-center gap-6 ml-8">
          <NuxtLink to="/" class="text-sm font-medium hover:text-[var(--blue)] transition-colors" active-class="text-[var(--blue)]">Dashboard</NuxtLink>
          <NuxtLink to="/grid" class="text-sm font-medium hover:text-[var(--blue)] transition-colors" active-class="text-[var(--blue)]">Grid Trading</NuxtLink>
          <NuxtLink to="/signals" class="text-sm font-medium hover:text-[var(--blue)] transition-colors" active-class="text-[var(--blue)]">Signals</NuxtLink>
          <NuxtLink to="/trades" class="text-sm font-medium hover:text-[var(--blue)] transition-colors" active-class="text-[var(--blue)]">History</NuxtLink>
          <NuxtLink to="/settings" class="text-sm font-medium hover:text-[var(--blue)] transition-colors" active-class="text-[var(--blue)]">Settings</NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-4">
        <!-- Binance Price & Status -->
        <BinanceStatus />

        <!-- Bot Status Badge -->
        <div class="flex items-center gap-2 px-3 py-1 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border)]">
          <div class="w-2 h-2 rounded-full" :class="botRunning ? 'bg-[var(--green)] animate-pulse' : 'bg-[var(--red)]'"></div>
          <span class="text-xs font-mono uppercase tracking-tight">{{ botRunning ? 'Running' : 'Stopped' }}</span>
        </div>
        
        <!-- Connection Status -->
        <div v-if="isConnected" class="text-[var(--green)]">
          <div class="i-lucide-wifi w-4 h-4"></div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 p-6">
      <NuxtPage />
    </main>

    <!-- Footer / Status Bar -->
    <footer class="bg-[var(--bg-secondary)] border-t border-[var(--border)] px-6 py-2 flex justify-between items-center text-[var(--text-muted)] text-[10px] font-mono">
      <div>SYSTEM READY // {{ new Date().toISOString() }}</div>
      <div class="flex gap-4">
        <span>LATENCY: 42ms</span>
        <span>API: v1.0</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// We'll implement the global bot state later in a composable
const isDryRun = ref(true)
const botRunning = ref(true)
const isConnected = ref(true)

import './assets/css/main.css'
</script>
