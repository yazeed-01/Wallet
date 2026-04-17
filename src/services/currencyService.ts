// Currency Exchange Service
// Fetches and caches exchange rates from MoneyConvert API

import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'currency-cache' });

const API_URL = 'https://cdn.moneyconvert.net/api/latest.json';
const CACHE_KEY = 'exchange_rates';
const CACHE_TIMESTAMP_KEY = 'exchange_rates_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (as per API terms)

export interface ExchangeRates {
    base: string; // Always 'USD'
    rates: { [currencyCode: string]: number };
    timestamp: number;
}

/**
 * Fetch fresh exchange rates from API
 */
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
    try {
        console.log('[CurrencyService] Fetching exchange rates from API...');
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log('[CurrencyService] Received rates for', Object.keys(data.rates).length, 'currencies');

        return {
            base: data.base,
            rates: data.rates,
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error('[CurrencyService] Failed to fetch exchange rates:', error);
        throw error;
    }
};

/**
 * Get exchange rates (from cache or fresh from API)
 */
export const getExchangeRates = async (
    forceRefresh: boolean = false
): Promise<ExchangeRates> => {
    // Check cache first
    const cachedData = storage.getString(CACHE_KEY);
    const cachedTimestamp = storage.getNumber(CACHE_TIMESTAMP_KEY);

    if (!forceRefresh && cachedData && cachedTimestamp) {
        const age = Date.now() - cachedTimestamp;

        // Use cache if less than 5 minutes old
        if (age < CACHE_DURATION) {
            console.log('[CurrencyService] Using cached rates (age:', Math.round(age / 1000), 'seconds)');
            const parsedData = JSON.parse(cachedData);
            return {
                ...parsedData,
                timestamp: cachedTimestamp,
            };
        }
    }

    // Fetch fresh rates
    try {
        const freshRates = await fetchExchangeRates();

        // Cache the new rates
        storage.set(CACHE_KEY, JSON.stringify(freshRates));
        storage.set(CACHE_TIMESTAMP_KEY, freshRates.timestamp);

        return freshRates;
    } catch (error) {
        // If fetch fails but we have stale cache, use it
        if (cachedData && cachedTimestamp) {
            console.warn('[CurrencyService] Using stale cached rates due to fetch failure');
            const parsedData = JSON.parse(cachedData);
            return {
                ...parsedData,
                timestamp: cachedTimestamp,
            };
        }

        // No cache available, throw error
        throw new Error('Failed to fetch exchange rates and no cache available');
    }
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<{
    convertedAmount: number;
    exchangeRate: number;
    timestamp: number;
}> => {
    // If same currency, no conversion needed
    if (fromCurrency === toCurrency) {
        return {
            convertedAmount: amount,
            exchangeRate: 1,
            timestamp: Date.now(),
        };
    }

    const rates = await getExchangeRates();

    // Get rates for both currencies (all rates are relative to USD)
    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];

    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }

    // Convert: amount in fromCurrency -> USD -> toCurrency
    // If fromCurrency is USD, fromRate would be undefined, so handle that
    const amountInUSD = fromCurrency === 'USD' ? amount : amount / fromRate;
    const convertedAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * toRate;

    // Calculate the direct exchange rate from fromCurrency to toCurrency
    const exchangeRate = toRate / fromRate;

    console.log(
        `[CurrencyService] Converted ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency} (rate: ${exchangeRate.toFixed(4)})`
    );

    return {
        convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
        exchangeRate,
        timestamp: rates.timestamp,
    };
};

/**
 * Get cached timestamp (for checking staleness)
 */
export const getCachedTimestamp = (): number | undefined => {
    return storage.getNumber(CACHE_TIMESTAMP_KEY);
};

/**
 * Check if cached rates are stale (older than 24 hours)
 */
export const areCachedRatesStale = (): boolean => {
    const timestamp = getCachedTimestamp();
    if (!timestamp) return true;

    const age = Date.now() - timestamp;
    return age > 24 * 60 * 60 * 1000; // 24 hours
};

/**
 * Clear cache (useful for testing)
 */
export const clearCache = (): void => {
    storage.remove(CACHE_KEY);
    storage.remove(CACHE_TIMESTAMP_KEY);
    console.log('[CurrencyService] Cache cleared');
};

/**
 * Get live exchange rate between two currencies
 */
export const getExchangeRate = async (
    fromCurrency: string,
    toCurrency: string
): Promise<number> => {
    if (fromCurrency === toCurrency) return 1;

    const rates = await getExchangeRates();
    const fromRate = fromCurrency === 'USD' ? 1 : rates.rates[fromCurrency];
    const toRate = toCurrency === 'USD' ? 1 : rates.rates[toCurrency];

    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }

    return toRate / fromRate;
};
