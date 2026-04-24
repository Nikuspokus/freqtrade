# 🚀 FreqDash — Advanced Freqtrade Dashboard

FreqDash is a high-performance, dark-themed dashboard for **Freqtrade**, built with **Nuxt 3** and **Tailwind CSS**. It provides a real-time interface to monitor your trading bot, manage open trades, and execute automated **Grid Trading** strategies on Binance.

![Dashboard Preview](app/assets/img/preview.png) *(Note: Add your screenshot here)*

## ✨ Key Features

-   **Live Dashboard**: Monitor open trades, profits, and bot status in real-time.
-   **Automated Grid Trading**: Multi-step wizard to create and deploy price grids on Binance.
-   **Signal Detection**: Real-time technical analysis (RSI, MACD) fetched directly from your bot.
-   **Safe by Design**: API keys are stored locally in your browser and never touch the server.
-   **Responsive UI**: Optimized for desktop and mobile monitoring.

## 🛠️ Tech Stack

-   **Framework**: Nuxt 3 (Vue 3)
-   **Styling**: Tailwind CSS + Custom Design System
-   **Strategy**: Freqtrade (Python)
-   **Price Feed**: Direct Binance API Integration

## 🚀 Quick Start

### 1. Prerequisites
-   A running instance of [Freqtrade](https://www.freqtrade.io/).
-   Node.js (v18+) installed.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/freqdash.git
cd freqdash

# Install dependencies
npm install
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
FREQTRADE_URL=http://your-bot-ip:8080
FREQTRADE_USER=your_username
FREQTRADE_PASS=your_password
DEMO_MODE=false
```

### 4. Launch
```bash
npm run dev
```
Open `http://localhost:3000` to access your dashboard.

## 🔲 Grid Trading Setup
To use the Grid Trading feature:
1.  Copy `freqtrade/strategies/GridStrategy.py` into your Freqtrade `user_data/strategies/` folder.
2.  Restart your Freqtrade bot with the new strategy.
3.  Configure your Binance API keys in the **Settings** page of FreqDash.

## ⚠️ Disclaimer
**Trading cryptocurrencies involves significant risk.** This software is provided "as is" without any warranty. Always test your strategies in **Dry Run** (Simulation) mode before using real funds. The authors are not responsible for any financial losses incurred.

---
Built with ❤️ for the Freqtrade community.
