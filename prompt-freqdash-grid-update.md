# PROMPT EXPERT — Update FreqDash : Grid Trading Binance Automatique

---

## 🎭 CONTEXTE & PROFIL

Tu es un expert senior fullstack JS et crypto trading, spécialisé dans :
- **Nuxt 4 + Tailwind CSS** — stack existante du projet FreqDash
- **Freqtrade** — bot open source Python, API REST complète
- **Grid Trading** — stratégie d'achat/vente automatique par niveaux de prix
- **Binance API** — connexion exchange, gestion des clés API, ordres spot
- **UX trading** — interfaces denses, temps réel, confirmations explicites

Tu interviens sur un projet **FreqDash déjà existant** (dashboard Nuxt 4 connecté à Freqtrade via API REST). L'UI actuelle a déjà : Dashboard, Signals, History, Settings avec connexion Freqtrade basique.

**Objectif de cet update :** Ajouter un module complet de **Grid Trading automatique connecté à Binance**, permettant à l'utilisateur de créer, monitorer et gérer des grilles de trading qui s'exécutent en autonomie 24/7 via Freqtrade.

---

## 🎯 CE QU'IL FAUT CONSTRUIRE

### Vue d'ensemble des ajouts

```
Ajouts à l'app existante :
├── app/pages/
│   └── grid.vue                    ← Page principale Grid Trading (NOUVELLE)
├── app/components/
│   ├── GridCreator.vue             ← Wizard de création de grille (NOUVEAU)
│   ├── GridCard.vue                ← Card de monitoring d'une grille active (NOUVEAU)
│   ├── GridLevelVisualizer.vue     ← Visualisation des niveaux prix (NOUVEAU)
│   ├── GridStats.vue               ← Stats de performance de la grille (NOUVEAU)
│   ├── GridConfirmModal.vue        ← Modal confirmation avant lancement (NOUVEAU)
│   └── BinanceStatus.vue           ← Status connexion Binance (NOUVEAU)
├── app/composables/
│   ├── useGridTrading.ts           ← Logique Grid + API Freqtrade (NOUVEAU)
│   └── useBinancePrice.ts          ← Prix temps réel Binance (NOUVEAU)
├── server/api/
│   ├── binance/price.get.ts        ← Proxy prix Binance (NOUVEAU)
│   └── grid/calculate.post.ts      ← Calcul paramètres grille (NOUVEAU)
└── freqtrade/
    └── strategies/
        └── GridStrategy.py         ← Stratégie Freqtrade Grid (NOUVEAU)
```

---

## 📡 FREQTRADE — CONFIGURATION BINANCE

### 1. `config.json` à générer / afficher dans les settings

```json
{
  "max_open_trades": 10,
  "stake_currency": "USDT",
  "stake_amount": "unlimited",
  "tradable_balance_ratio": 0.99,
  "fiat_display_currency": "EUR",
  "dry_run": true,
  "dry_run_wallet": 100,

  "exchange": {
    "name": "binance",
    "key": "TA_CLE_API_BINANCE",
    "secret": "TON_SECRET_API_BINANCE",
    "ccxt_config": {},
    "ccxt_async_config": {},
    "pair_whitelist": ["BTC/USDT", "ETH/USDT"],
    "pair_blacklist": []
  },

  "api_server": {
    "enabled": true,
    "listen_ip_address": "127.0.0.1",
    "listen_port": 8080,
    "username": "freqtrader",
    "password": "CHANGE_THIS_PASSWORD",
    "CORS_origins": ["http://localhost:3000", "https://ton-dashboard.netlify.app"]
  },

  "bot_name": "FreqDash-Grid",
  "initial_state": "running",
  "internals": {
    "process_throttle_secs": 5
  }
}
```

### 2. Clés API Binance — permissions requises

```
✅ Enable Reading          (obligatoire)
✅ Enable Spot & Margin Trading  (obligatoire pour trader)
❌ Enable Withdrawals      (JAMAIS — sécurité absolue)
❌ Enable Futures          (pas nécessaire)

Restriction IP recommandée : IP de ton VPS/PC uniquement
```

---

## 🔲 LA STRATÉGIE GRID — `GridStrategy.py`

Ce fichier Python doit être placé dans `freqtrade/user_data/strategies/`.

```python
# GridStrategy.py
# Stratégie de Grid Trading pour Freqtrade
# Compatible Freqtrade >= 2023.x

from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter
from pandas import DataFrame
import talib.abstract as ta

class GridStrategy(IStrategy):
    """
    Stratégie Grid Trading simple.
    Achète quand le prix descend d'un niveau, vend quand il remonte.
    """

    # Paramètres configurables depuis le dashboard
    INTERFACE_VERSION = 3
    timeframe = '5m'

    # Paramètres de la grille (configurables via hyperopt ou dashboard)
    grid_levels = IntParameter(3, 20, default=6, space='buy')
    grid_range_pct = DecimalParameter(0.02, 0.20, default=0.08, space='buy')
    take_profit_pct = DecimalParameter(0.005, 0.05, default=0.015, space='sell')

    # Risk management
    stoploss = -0.15          # Stop loss global à -15%
    trailing_stop = False
    use_exit_signal = True
    exit_profit_only = False
    ignore_roi_if_entry_signal = False

    # ROI (sortie automatique si atteint)
    minimal_roi = {
        "0": 0.015,           # 1.5% de profit → vente automatique
        "30": 0.01,           # après 30min, 1% suffit
        "60": 0.005,          # après 1h, 0.5% suffit
        "120": 0              # après 2h, vente même à 0%
    }

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Prix moyen sur la période
        dataframe['ema20'] = ta.EMA(dataframe, timeperiod=20)
        dataframe['ema50'] = ta.EMA(dataframe, timeperiod=50)
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)

        # Bandes de Bollinger pour définir les niveaux de grille
        bollinger = ta.BBANDS(dataframe, timeperiod=20, nbdevup=2.0, nbdevdn=2.0)
        dataframe['bb_upper'] = bollinger['upperband']
        dataframe['bb_lower'] = bollinger['lowerband']
        dataframe['bb_middle'] = bollinger['middleband']

        # Calcul des niveaux de grille dynamiques
        dataframe['grid_step'] = (
            (dataframe['bb_upper'] - dataframe['bb_lower']) /
            self.grid_levels.value
        )

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Signal d'achat : prix proche d'un niveau bas de la grille
        + RSI pas en surachat
        """
        dataframe.loc[
            (
                # Prix dans le tiers inférieur des bandes de Bollinger
                (dataframe['close'] <= dataframe['bb_lower'] * 1.02) &
                # RSI pas en surachat
                (dataframe['rsi'] < 65) &
                # Volume suffisant (évite les faux signaux)
                (dataframe['volume'] > 0)
            ),
            'enter_long'
        ] = 1

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Signal de vente : prix a remonté au niveau supérieur de la grille
        """
        dataframe.loc[
            (
                # Prix dans le tiers supérieur des bandes de Bollinger
                (dataframe['close'] >= dataframe['bb_upper'] * 0.98) &
                # RSI en zone de surachat
                (dataframe['rsi'] > 65)
            ),
            'exit_long'
        ] = 1

        return dataframe
```

---

## 🖥️ PAGE GRID TRADING — `grid.vue`

### Layout de la page

```
┌─────────────────────────────────────────────────────────┐
│  GRID TRADING                    [+ Nouvelle Grille]    │
│  Bot automatique Binance · 2 grilles actives            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── GRILLE ACTIVE ──────────────────────────────┐    │
│  │  BTC/USDT              ● RUNNING    [■ STOP]   │    │
│  │  Investi : 20€   Profit : +0.34€ (+1.7%)       │    │
│  │                                                 │    │
│  │  95 000 ──── VENTE ✓ (exécuté)                 │    │
│  │  94 000 ──── VENTE ✓ (exécuté)                 │    │
│  │  93 000 ──── VENTE (en attente)                 │    │
│  │  ▶▶▶▶▶▶ PRIX ACTUEL : 92 450                   │    │
│  │  91 000 ──── ACHAT ✓ (exécuté à 91 200)        │    │
│  │  90 000 ──── ACHAT (en attente)                 │    │
│  │  89 000 ──── ACHAT (en attente)                 │    │
│  │                                                 │    │
│  │  Trades : 4  │  Win rate : 75%  │  Fees : 0.04€│    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─── CRÉER UNE GRILLE ───────────────────────────┐    │
│  │  [Wizard de configuration → voir ci-dessous]    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🧙 WIZARD DE CRÉATION — `GridCreator.vue`

Un stepper en 4 étapes, pas un formulaire plat.

### Étape 1 — Paire & Capital

```
Quelle paire veux-tu trader ?
[BTC/USDT] [ETH/USDT] [BNB/USDT] [Autre...]

Capital à allouer : [____] USDT
Prix actuel BTC/USDT : 92 450 USDT (live)
```

### Étape 2 — Configuration de la grille

```
Range de prix (±% autour du prix actuel)
[────●────────] 8%
→ De 85 054 USDT à 99 846 USDT

Nombre de niveaux
[──●──────────] 6 niveaux

Capital par niveau : 3.33 USDT (20€ ÷ 6)
Profit par niveau : ~1.5% = ~0.05€ par trade
```

### Étape 3 — Sécurité

```
Stop Loss global : [-15%] → à 78 582 USDT
Si BTC descend sous ce seuil → arrêt automatique

Take Profit total : [+20%] → à 110 940 USDT
Si ce niveau est atteint → arrêt et encaissement

Mode : ● DRY RUN (simulation)  ○ LIVE (argent réel)
```

### Étape 4 — Résumé & Confirmation

```
┌──────────────────────────────────────────┐
│  ⚠️  RÉSUMÉ DE LA GRILLE                 │
├──────────────────────────────────────────┤
│  Paire            BTC/USDT               │
│  Capital          20.00 USDT (~18.5€)    │
│  Range            85 054 → 99 846        │
│  Niveaux          6 (écart : 2 465 USD)  │
│  Profit/niveau    ~0.05€ par trade       │
│  Stop Loss        -15% → 78 582 USDT    │
│  Mode             ⚠️ LIVE — ARGENT RÉEL  │
├──────────────────────────────────────────┤
│  Estimation (non garantie) :             │
│  Si BTC oscille dans la range :          │
│  ~2-5 trades/jour × 0.05€ = 0.1-0.25€   │
│  Objectif 10€ estimé : 40-100 jours      │
├──────────────────────────────────────────┤
│  ⚠️  Le trading crypto comporte des      │
│     risques de perte en capital.         │
│     Ne jamais investir plus que ce       │
│     qu'on peut se permettre de perdre.   │
├──────────────────────────────────────────┤
│  [← Modifier]          [🚀 Lancer]       │
└──────────────────────────────────────────┘
```

---

## 🔌 COMPOSABLE `useGridTrading.ts`

```typescript
// Gestion complète du Grid Trading via API Freqtrade

interface GridConfig {
  pair: string              // Ex: "BTC/USDT"
  capital: number           // En USDT
  rangePct: number          // Ex: 0.08 pour ±8%
  levels: number            // Nombre de niveaux
  stopLossPct: number       // Ex: -0.15
  takeProfitPct: number     // Ex: 0.20
  mode: 'dry' | 'live'
}

interface GridLevel {
  price: number
  type: 'buy' | 'sell'
  status: 'pending' | 'executed' | 'cancelled'
  tradeId?: number
  executedAt?: string
  profit?: number
}

interface ActiveGrid {
  id: string
  pair: string
  config: GridConfig
  levels: GridLevel[]
  currentPrice: number
  totalProfit: number
  totalTrades: number
  winRate: number
  totalFees: number
  status: 'running' | 'stopped' | 'completed'
  startedAt: string
}

const useGridTrading = () => {
  const activeGrids = ref<ActiveGrid[]>([])
  const isCreating = ref(false)

  // Calcule les niveaux de prix de la grille
  const calculateLevels = (config: GridConfig, currentPrice: number): GridLevel[] => {
    const levels: GridLevel[] = []
    const rangeAmount = currentPrice * config.rangePct
    const step = (rangeAmount * 2) / config.levels

    for (let i = 0; i <= config.levels; i++) {
      const price = (currentPrice - rangeAmount) + (step * i)
      levels.push({
        price: Math.round(price),
        type: price < currentPrice ? 'buy' : 'sell',
        status: 'pending'
      })
    }

    return levels.sort((a, b) => b.price - a.price)
  }

  // Lance une grille via Freqtrade
  // En pratique : configure la stratégie Grid et force les premiers ordres
  const launchGrid = async (config: GridConfig) => {
    isCreating.value = true
    try {
      // 1. Recharger la config Freqtrade avec les nouveaux paramètres
      await $fetch('/api/freqtrade/reload-config', { method: 'POST' })

      // 2. Si mode live, vérifier le solde disponible
      if (config.mode === 'live') {
        const balance = await $fetch('/api/freqtrade/balance')
        if (balance.total < config.capital) {
          throw new Error(`Solde insuffisant : ${balance.total} USDT disponibles`)
        }
      }

      // 3. Forcer le premier achat pour initialiser la grille
      await $fetch('/api/freqtrade/forcebuy', {
        method: 'POST',
        body: {
          pair: config.pair,
          stake_amount: config.capital / config.levels,
          ordertype: 'market'
        }
      })

      // 4. Stocker la config de la grille localement
      const grid: ActiveGrid = {
        id: crypto.randomUUID(),
        pair: config.pair,
        config,
        levels: calculateLevels(config, await getCurrentPrice(config.pair)),
        currentPrice: 0,
        totalProfit: 0,
        totalTrades: 0,
        winRate: 0,
        totalFees: 0,
        status: 'running',
        startedAt: new Date().toISOString()
      }

      activeGrids.value.push(grid)
      // Persister dans localStorage
      localStorage.setItem('freqdash_grids', JSON.stringify(activeGrids.value))

    } finally {
      isCreating.value = false
    }
  }

  // Arrêt d'urgence d'une grille — ferme tous les trades ouverts
  const stopGrid = async (gridId: string) => {
    const grid = activeGrids.value.find(g => g.id === gridId)
    if (!grid) return

    // Récupérer tous les trades ouverts sur cette paire
    const trades = await $fetch(`/api/freqtrade/status`)
    const gridTrades = trades.filter((t: any) => t.pair === grid.pair)

    // Force sell chacun
    for (const trade of gridTrades) {
      await $fetch('/api/freqtrade/forcesell', {
        method: 'POST',
        body: { tradeid: trade.trade_id, ordertype: 'market' }
      })
    }

    grid.status = 'stopped'
    localStorage.setItem('freqdash_grids', JSON.stringify(activeGrids.value))
  }

  const getCurrentPrice = async (pair: string): Promise<number> => {
    const data = await $fetch(`/api/binance/price?pair=${pair}`)
    return data.price
  }

  return {
    activeGrids,
    isCreating,
    calculateLevels,
    launchGrid,
    stopGrid,
    getCurrentPrice
  }
}
```

---

## 📊 VISUALISEUR DE NIVEAUX — `GridLevelVisualizer.vue`

Le composant le plus important visuellement. Affiche les niveaux comme une échelle de prix verticale avec le prix actuel qui se déplace en temps réel.

```vue
<template>
  <div class="grid-visualizer">
    <!-- Niveaux de prix affichés verticalement -->
    <div
      v-for="level in sortedLevels"
      :key="level.price"
      class="level-row"
      :class="{
        'level-sell': level.type === 'sell',
        'level-buy': level.type === 'buy',
        'level-executed': level.status === 'executed',
        'level-current': isCurrentPriceNear(level.price)
      }"
    >
      <!-- Indicateur prix actuel -->
      <div v-if="isCurrentPriceNear(level.price)" class="current-price-indicator">
        ▶ {{ formatPrice(currentPrice) }}
      </div>

      <div class="level-price">{{ formatPrice(level.price) }}</div>
      <div class="level-line"></div>
      <div class="level-action">
        <span class="level-type-badge">{{ level.type === 'buy' ? 'ACHAT' : 'VENTE' }}</span>
        <span class="level-status">{{ getStatusLabel(level.status) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Couleurs : vert pour les achats, rouge pour les ventes */
/* Niveaux exécutés : opacité réduite avec checkmark */
/* Prix actuel : ligne animée qui pulse */
/* Animation : le prix actuel se déplace fluidement */
.current-price-indicator {
  animation: pulse 1s infinite;
  color: #f59e0b;
  font-weight: bold;
}
</style>
```

---

## 🔒 SÉCURITÉ BINANCE — RÈGLES ABSOLUES

### Dans les Settings, ajouter une section "Connexion Binance"

```
Clé API Binance    [••••••••••••••••••••]  [Tester]
Secret API         [••••••••••••••••••••]

⚠️  Permissions requises sur Binance :
✅ Lecture seule
✅ Trading Spot
❌ Retraits (NE JAMAIS ACTIVER)

💡 Restreindre l'IP à : [IP de ton VPS]
```

### Côté code — JAMAIS de credentials dans le bundle client

```typescript
// server/api/binance/price.get.ts
// Les clés API Binance passent UNIQUEMENT par les server routes Nuxt
// Jamais dans le composable client

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pair = (query.pair as string).replace('/', '')  // BTCUSDT

  // Prix public Binance — pas besoin de clé API pour les prix
  const data = await $fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${pair}USDT`
  )

  return { price: parseFloat(data.price), pair: query.pair }
})
```

---

## 📋 ORDRE D'IMPLÉMENTATION

### Jour 1 — Config Binance + prix temps réel
1. Ajouter section Binance dans `settings.vue` (clé API + secret)
2. Server route `/api/binance/price` pour les prix live
3. Composable `useBinancePrice.ts` avec polling toutes les 5 secondes
4. Composant `BinanceStatus.vue` dans le header (connexion OK/KO)

### Jour 2 — Wizard de création de grille
1. Page `grid.vue` avec layout de base
2. Composant `GridCreator.vue` — stepper 4 étapes
3. Calcul en temps réel des niveaux selon les paramètres
4. `GridLevelVisualizer.vue` — preview de la grille avant lancement

### Jour 3 — Modal de confirmation + lancement
1. `GridConfirmModal.vue` avec avertissement risque explicite
2. Intégration `useGridTrading.ts` — `launchGrid()`
3. Persistance des grilles actives en localStorage
4. Bandeau "DRY RUN" ou "⚠️ ARGENT RÉEL" toujours visible

### Jour 4 — Monitoring des grilles actives
1. `GridCard.vue` avec niveaux en temps réel
2. `GridStats.vue` — trades, win rate, fees, profit
3. Bouton STOP URGENCE avec confirmation
4. Sync avec les trades ouverts Freqtrade (`/api/v1/status`)

### Jour 5 — Polish & tests dry-run
1. Animations sur le prix actuel dans le visualiseur
2. Notifications (badge) quand un niveau est exécuté
3. Test complet en dry-run avec Freqtrade
4. Export des stats de la grille en CSV

---

## ⚙️ COMMANDE DE LANCEMENT FREQTRADE AVEC GRID

```bash
# Lancer Freqtrade avec la stratégie Grid en DRY RUN
freqtrade trade \
  --config config.json \
  --strategy GridStrategy \
  --dry-run \
  --dry-run-wallet 100

# Passer en LIVE (argent réel) — seulement après tests dry-run concluants
freqtrade trade \
  --config config.json \
  --strategy GridStrategy
  # dry_run: false dans config.json
```

---

## ⚠️ RÈGLES ABSOLUES DE SÉCURITÉ

1. **Bandeau permanent** en haut de page : vert "DRY RUN — Simulation" ou rouge clignotant "⚠️ LIVE — Argent Réel". Jamais caché.

2. **Double confirmation** avant tout lancement en mode LIVE : modal de confirmation + case à cocher "Je comprends que je risque de perdre mon capital".

3. **Bouton STOP d'urgence** toujours visible et accessible sur chaque grille active. Rouge, prominent, jamais caché derrière un menu.

4. **Jamais de withdrawal permissions** sur les clés API Binance. Vérifier et afficher les permissions détectées dans les settings.

5. **Stop Loss obligatoire** — le wizard ne permet pas de lancer une grille sans stop loss configuré.

6. **Capital max recommandé affiché** : "Pour débuter, ne mets pas plus de 20-50€ sur une seule grille."

7. **Estimation honnête** dans la modal de confirmation : afficher le scénario de perte maximale (stop loss déclenché) en € avant le scénario de gain.

---

## 📎 RESSOURCES

- Freqtrade Grid docs : https://www.freqtrade.io/en/stable/configuration/
- Stratégies Grid communautaires : https://github.com/freqtrade/freqtrade-strategies
- Binance API prix publics : https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
- Binance API docs : https://binance-docs.github.io/apidocs/spot/en/

---

*Prompt rédigé pour Claude Sonnet — update du projet FreqDash existant (Nuxt 4 + Tailwind + Freqtrade API). Nicolas, dev fullstack JS en mission Leroy Merlin.*
