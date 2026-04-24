# 📋 GUIDE COMPLET — FreqDash sur VPS Hetzner
## Sans installation locale · Budget max 5€/mois

---

## 🗺️ VUE D'ENSEMBLE

```
TON PC (VSCode + navigateur)
    │
    ├── GitHub (ton code FreqDash)
    │       │
    │       └── Netlify (déploiement automatique du dashboard)
    │                   │
    │                   └── VPS Hetzner CX23 à 3.99€/mois
    │                               │
    │                               ├── Freqtrade (bot Python)
    │                               └── Binance API (trading)
```

Tu codes sur ton PC → tu push sur GitHub → Netlify déploie automatiquement → le VPS fait tourner le bot 24/7.

---

## PHASE 1 — CRÉER ET CONFIGURER LE VPS HETZNER

### Étape 1.1 — Créer le serveur

Sur https://console.hetzner.cloud :
1. New Project → nom : `freqdash`
2. Add Server
3. **Location** : Nuremberg (NBG1) — plus proche de la France
4. **Image** : Ubuntu 22.04
5. **Type** : Shared vCPU → **CX23** (3.99€/mois)
6. **Networking** : cocher **Primary IPv4** (+0.50€ = 4.49€/mois total)
7. **SSH Keys** : ajouter ta clé publique (voir ci-dessous)
8. **Name** : `freqdash-vps`
9. → **Create & Buy now**

### Étape 1.2 — Générer ta clé SSH (sur ton PC)

Dans ton terminal VSCode (Git Bash sur Windows) :
```bash
ssh-keygen -t ed25519 -C "freqdash-vps"
# Appuie 3 fois sur Entrée (pas de passphrase)

# Afficher la clé publique à coller dans Hetzner
cat ~/.ssh/id_ed25519.pub
```
Copie le résultat (commence par `ssh-ed25519 AAAA...`) → colle dans Hetzner.

### Étape 1.3 — Se connecter au VPS

```bash
# Depuis ton terminal PC
ssh root@IP_DU_VPS
# Ex: ssh root@65.21.123.456
```
Tu es maintenant sur le VPS. Toutes les commandes suivantes se font sur le VPS.

---

## PHASE 2 — INSTALLER FREQTRADE SUR LE VPS

### Étape 2.1 — Mettre à jour le système

```bash
apt update && apt upgrade -y
apt install -y git wget curl nano
```

### Étape 2.2 — Installer Freqtrade

```bash
git clone https://github.com/freqtrade/freqtrade.git
cd freqtrade
./setup.sh -i
# Répond Y à toutes les questions
# L'installation prend 5-10 minutes
```

### Étape 2.3 — Activer l'environnement Python

```bash
source .venv/bin/activate
# Tu dois voir (.venv) devant ton prompt
```

### Étape 2.4 — Créer les dossiers nécessaires

```bash
mkdir -p user_data/strategies
mkdir -p user_data/logs
```

---

## PHASE 3 — CONFIGURER FREQTRADE

### Étape 3.1 — Créer le fichier config.json

```bash
nano user_data/config.json
```

Colle exactement ce contenu (pour commencer en DRY RUN — simulation) :

```json
{
  "max_open_trades": 5,
  "stake_currency": "USDT",
  "stake_amount": 4,
  "tradable_balance_ratio": 0.99,
  "fiat_display_currency": "EUR",
  "dry_run": true,
  "dry_run_wallet": 100,
  "cancel_open_orders_on_exit": true,

  "exchange": {
    "name": "binance",
    "key": "",
    "secret": "",
    "ccxt_config": {},
    "ccxt_async_config": {},
    "pair_whitelist": [
      "BTC/USDT"
    ],
    "pair_blacklist": []
  },

  "entry_pricing": {
    "price_side": "same",
    "use_order_book": true,
    "order_book_top": 1,
    "check_depth_of_market": {
      "enabled": false,
      "bids_to_ask_delta": 1
    }
  },

  "exit_pricing": {
    "price_side": "same",
    "use_order_book": true,
    "order_book_top": 1
  },

  "api_server": {
    "enabled": true,
    "listen_ip_address": "0.0.0.0",
    "listen_port": 8080,
    "verbosity": "error",
    "enable_openapi": false,
    "jwt_secret_key": "CHANGE_THIS_TO_RANDOM_STRING_32_CHARS",
    "CORS_origins": [
      "https://TON_SITE.netlify.app",
      "http://localhost:3000"
    ],
    "username": "freqtrader",
    "password": "CHANGE_THIS_PASSWORD"
  },

  "bot_name": "FreqDash-Grid",
  "initial_state": "running",
  "force_entry_enable": true,
  "internals": {
    "process_throttle_secs": 5
  }
}
```

**Sauvegarde** : Ctrl+X → Y → Entrée

⚠️ **Remplace obligatoirement :**
- `CHANGE_THIS_TO_RANDOM_STRING_32_CHARS` → une chaîne aléatoire (ex: `a8f3k9p2m7x1q5r6t4n0w8y2j6h3b9e1`)
- `CHANGE_THIS_PASSWORD` → un vrai mot de passe (ex: `MonMotDePasse2024!`)
- `TON_SITE.netlify.app` → l'URL de ton site Netlify

### Étape 3.2 — Installer la stratégie Grid

```bash
nano user_data/strategies/GridStrategy.py
```

Colle ce contenu :

```python
from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter
from pandas import DataFrame
import talib.abstract as ta


class GridStrategy(IStrategy):
    """
    Stratégie Grid Trading pour FreqDash
    Achat sur oversold RSI + bande basse Bollinger
    Vente sur overbought RSI + bande haute Bollinger
    """

    INTERFACE_VERSION = 3
    timeframe = '5m'

    # Risk management
    stoploss = -0.10          # Stop loss à -10%
    trailing_stop = False
    use_exit_signal = True
    exit_profit_only = False

    # ROI — sortie automatique si profit atteint
    minimal_roi = {
        "0": 0.015,       # 1.5% → vente immédiate
        "30": 0.010,      # après 30min → 1%
        "60": 0.005,      # après 1h → 0.5%
        "120": 0          # après 2h → vente quoi qu'il arrive
    }

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)

        # Moyennes mobiles
        dataframe['ema20'] = ta.EMA(dataframe, timeperiod=20)
        dataframe['ema50'] = ta.EMA(dataframe, timeperiod=50)

        # Bandes de Bollinger
        bollinger = ta.BBANDS(dataframe, timeperiod=20, nbdevup=2.0, nbdevdn=2.0)
        dataframe['bb_upper'] = bollinger['upperband']
        dataframe['bb_lower'] = bollinger['lowerband']
        dataframe['bb_middle'] = bollinger['middleband']

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """Achat : RSI oversold + prix proche bande basse"""
        dataframe.loc[
            (
                (dataframe['rsi'] < 35) &
                (dataframe['close'] <= dataframe['bb_lower'] * 1.02) &
                (dataframe['volume'] > 0)
            ),
            'enter_long'
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """Vente : RSI overbought + prix proche bande haute"""
        dataframe.loc[
            (
                (dataframe['rsi'] > 65) &
                (dataframe['close'] >= dataframe['bb_upper'] * 0.98)
            ),
            'exit_long'
        ] = 1
        return dataframe
```

**Sauvegarde** : Ctrl+X → Y → Entrée

---

## PHASE 4 — SÉCURISER LE VPS

### Étape 4.1 — Ouvrir le port 8080 pour Netlify

```bash
ufw allow ssh
ufw allow 8080
ufw enable
# Réponds Y
```

### Étape 4.2 — Vérifier que le port est ouvert

```bash
ufw status
# Tu dois voir :
# 22/tcp   ALLOW   Anywhere
# 8080     ALLOW   Anywhere
```

---

## PHASE 5 — LANCER FREQTRADE

### Étape 5.1 — Premier lancement (test)

```bash
cd ~/freqtrade
source .venv/bin/activate

freqtrade trade \
  --config user_data/config.json \
  --strategy GridStrategy \
  --dry-run
```

Tu dois voir :
```
INFO - Using CCXT dry_run exchange
INFO - API Server started at http://0.0.0.0:8080
INFO - Bot heartbeat. Balance: 100.00 USDT
```

### Étape 5.2 — Tester l'API depuis ton PC

Ouvre un navigateur et tape :
```
http://IP_DU_VPS:8080/api/v1/ping
```
Tu dois voir : `{"status":"pong"}` ✅

Si ça marche → **Freqtrade est en ligne et accessible depuis internet.**

### Étape 5.3 — Lancer en arrière-plan (24/7)

```bash
# Arrêter le bot (Ctrl+C d'abord)

# Installer screen pour lancer en arrière-plan
apt install -y screen

# Créer une session screen
screen -S freqtrade

# Lancer le bot
cd ~/freqtrade
source .venv/bin/activate
freqtrade trade \
  --config user_data/config.json \
  --strategy GridStrategy \
  --dry-run

# Détacher la session (le bot continue sans toi)
# Appuie sur : Ctrl+A puis D
```

Pour revenir voir le bot plus tard :
```bash
screen -r freqtrade
```

---

## PHASE 6 — CONFIGURER TON PROJET NUXT (FreqDash)

### Étape 6.1 — Fichier .env.example de ton repo

Ton `.env.example` doit contenir :
```bash
FREQTRADE_URL=http://IP_DU_VPS:8080
FREQTRADE_USER=freqtrader
FREQTRADE_PASS=CHANGE_THIS_PASSWORD
```

### Étape 6.2 — nuxt.config.ts

Vérifie que ton `nuxt.config.ts` contient :
```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    freqtradeUrl: process.env.FREQTRADE_URL || 'http://localhost:8080',
    freqtradeUser: process.env.FREQTRADE_USER || 'freqtrader',
    freqtradePass: process.env.FREQTRADE_PASS || '',
  }
})
```

### Étape 6.3 — Server route proxy (server/api/freqtrade/[...path].ts)

Ce fichier fait le lien entre ton dashboard et Freqtrade.
Vérifie qu'il contient :

```typescript
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = getRouterParam(event, 'path')
  const method = event.method
  const body = method !== 'GET' ? await readBody(event) : undefined

  const credentials = btoa(
    `${config.freqtradeUser}:${config.freqtradePass}`
  )

  try {
    return await $fetch(`${config.freqtradeUrl}/api/v1/${path}`, {
      method,
      body,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      message: `Freqtrade API error: ${error?.message}`
    })
  }
})
```

---

## PHASE 7 — DÉPLOYER SUR NETLIFY

### Étape 7.1 — Connecter GitHub à Netlify

1. Va sur https://netlify.com → Log in with GitHub
2. **Add new site** → Import an existing project
3. Sélectionne ton repo `Nikuspokus/freqtrade`
4. **Build settings** :
   - Build command : `npm run build`
   - Publish directory : `.output/public`
5. → **Deploy site**

### Étape 7.2 — Ajouter les variables d'environnement

Dans Netlify → **Site configuration** → **Environment variables** → Add variable :

```
FREQTRADE_URL    = http://IP_DU_VPS:8080
FREQTRADE_USER   = freqtrader
FREQTRADE_PASS   = TonMotDePasse
```

⚠️ Remplace `IP_DU_VPS` par l'IP réelle de ton serveur Hetzner.

### Étape 7.3 — Redéployer après les variables

Dans Netlify → **Deploys** → **Trigger deploy** → Deploy site.

### Étape 7.4 — Mettre à jour le CORS dans config.json

Sur le VPS, une fois que tu as l'URL Netlify (ex: `freqdash-abc123.netlify.app`) :

```bash
nano ~/freqtrade/user_data/config.json
```

Mets à jour `CORS_origins` :
```json
"CORS_origins": [
  "https://freqdash-abc123.netlify.app"
]
```

Relance le bot :
```bash
screen -r freqtrade
# Ctrl+C pour arrêter
freqtrade trade --config user_data/config.json --strategy GridStrategy --dry-run
# Ctrl+A puis D pour détacher
```

---

## PHASE 8 — OBTENIR LES CLÉS API BINANCE (quand tu passes en live)

⚠️ **Ne fais cette étape QU'APRÈS 3 semaines de dry-run concluantes.**

### Étape 8.1 — Créer les clés sur Binance

1. Binance → Mon compte → Gestion des API
2. **Créer une API** → "Clé API générée par le système"
3. Nom : `freqtrade-vps`
4. **Permissions à cocher :**
   ```
   ✅ Activer la lecture
   ✅ Activer le trading Spot et sur marge
   ❌ Activer les retraits  ← JAMAIS
   ❌ Activer les futures   ← pas nécessaire
   ```
5. **Restriction IP** → entre l'IP de ton VPS Hetzner
6. Copie la **clé API** et le **Secret** (visible une seule fois !)

### Étape 8.2 — Mettre les clés dans config.json

```bash
nano ~/freqtrade/user_data/config.json
```

Modifie :
```json
"dry_run": false,
"exchange": {
  "name": "binance",
  "key": "TA_CLE_API_ICI",
  "secret": "TON_SECRET_ICI"
}
```

Relance le bot — **maintenant il trade avec de l'argent réel.**

---

## CHECKLIST FINALE

```
VPS HETZNER
□ CX23 Ubuntu 22.04 créé
□ SSH key configurée
□ Freqtrade installé
□ config.json créé avec bons credentials
□ GridStrategy.py dans user_data/strategies/
□ Port 8080 ouvert (ufw)
□ Bot lancé en dry-run dans screen
□ /api/v1/ping répond depuis le navigateur

GITHUB
□ .env NON commité (dans .gitignore)
□ .env.example commité avec les clés vides
□ Code pushé sur main

NETLIFY
□ Repo connecté
□ Variables d'environnement ajoutées
□ Build réussi
□ Test Connection dans Settings → ✅

BINANCE (plus tard)
□ 3 semaines de dry-run positives
□ Clés API créées avec bonnes permissions
□ IP du VPS restreinte
□ config.json mis à jour
□ 20€ max pour commencer
```

---

## COÛTS MENSUELS RÉELS

```
VPS Hetzner CX23    3.99€
IPv4 fixe           0.50€
─────────────────────────
TOTAL               4.49€/mois

Netlify             0€ (plan gratuit)
GitHub              0€ (plan gratuit)
Binance             0€ (frais uniquement sur les trades : 0.1%)
```

---

## COMMANDES UTILES SUR LE VPS

```bash
# Se reconnecter au bot
screen -r freqtrade

# Voir les logs du bot
tail -f ~/freqtrade/user_data/logs/freqtrade.log

# Redémarrer le bot
screen -r freqtrade
# Ctrl+C → relancer la commande freqtrade trade...

# Vérifier que l'API répond
curl http://localhost:8080/api/v1/ping

# Voir les trades ouverts
curl -u freqtrader:TonMotDePasse http://localhost:8080/api/v1/status

# Voir le solde
curl -u freqtrader:TonMotDePasse http://localhost:8080/api/v1/balance
```

---

*Guide rédigé pour Nicolas — FreqDash (Nuxt 4 + Freqtrade + Binance) · VPS Hetzner CX23 · Budget 5€/mois*
