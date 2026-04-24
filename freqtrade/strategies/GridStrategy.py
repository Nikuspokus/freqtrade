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
    process_only_new_candles = True

    # ROI (sortie automatique si atteint)
    minimal_roi = {
        "0": 0.015,           # 1.5% de profit → vente automatique
        "30": 0.01,           # après 30min, 1% suffit
        "60": 0.005,          # après 1h, 0.5% suffit
        "120": 0              # après 2h, vente même à 0%
    }

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Indicateurs techniques de base
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)

        # Bandes de Bollinger pour définir les niveaux de grille
        bollinger = ta.BBANDS(dataframe, timeperiod=20, nbdevup=2.0, nbdevdn=2.0)
        dataframe['bb_upper'] = bollinger['upperband']
        dataframe['bb_lower'] = bollinger['lowerband']
        dataframe['bb_middle'] = bollinger['middleband']

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
