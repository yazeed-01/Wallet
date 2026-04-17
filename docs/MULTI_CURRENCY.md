# Multi-Currency Support

## Overview
The wallet app now supports multi-currency transactions with real-time conversion using the MoneyConvert.net API.

## Features

### 1. **Currency Selection**
- Select from 40+ popular currencies including:
  - USD (US Dollar)
  - EUR (Euro)
  - JOD (Jordanian Dinar)
  - SAR (Saudi Riyal)
  - AED (UAE Dirham)
  - And many more...

### 2. **Real-Time Conversion**
- Automatic conversion to your account's base currency
- Uses live exchange rates updated every 5 minutes
- Offline support with cached rates

### 3. **Interactive Conversion Calculator**
- Preview currency conversions before saving
- Swap currencies with one tap
- See live exchange rates

### 4. **Transparent Display**
- Transactions show both original and converted amounts
- Clear visibility of exchange rates used
- Balance calculations use converted amounts

## How to Use

### Adding a Transaction with Different Currency

1. **Open Add Transaction Screen**
   - Tap the "+" button or navigate to Add Transaction

2. **Select Currency**
   - Choose your transaction currency from the currency picker
   - Defaults to your account currency

3. **Enter Amount**
   - Enter the amount in the selected currency

4. **Convert (Optional)**
   - If using a different currency, tap "Convert [FROM] → [TO]"
   - Use the conversion calculator to preview the exchange
   - The conversion happens automatically on save if not previewed

5. **Save Transaction**
   - Transaction saves with:
     - Original currency and amount
     - Exchange rate used
     - Converted amount in account currency
   - Your balance updates with the converted amount

## Technical Details

### Database Schema
The `transactions` table now includes:
- `currency` - Currency code (e.g., 'USD', 'JOD')
- `original_amount` - Amount in original currency
- `exchange_rate` - Rate used for conversion
- `converted_amount` - Amount in account's base currency

### API Integration
- **Endpoint**: https://cdn.moneyconvert.net/api/latest.json
- **Base Currency**: USD
- **Update Frequency**: Every 5 minutes
- **Cache**: MMKV storage for offline access

### Balance Calculations
- All balance updates use the **converted amount**
- This ensures accuracy regardless of transaction currency
- Monthly stats and analytics use converted amounts

## Files Added

1. **src/constants/currencies.ts** - Currency definitions and helpers
2. **src/services/currencyService.ts** - API integration and conversion logic
3. **src/components/forms/CurrencyPicker.tsx** - Currency selection component
4. **src/components/transactions/CurrencyConversionModal.tsx** - Conversion calculator

## Files Modified

1. **src/database/schema.ts** - Updated to v4 with currency fields
2. **src/database/migrations.ts** - Added migration for v3→v4
3. **src/types/models.ts** - Updated Transaction interface
4. **src/database/repositories/TransactionRepository.ts** - Currency field handling
5. **src/screens/transactions/AddTransactionScreen.tsx** - UI and conversion logic

## Migration Notes

The app will automatically migrate from schema v3 to v4:
- Adds 4 new columns to transactions table
- Existing transactions default to 'USD' currency
- No data loss during migration

## Testing Checklist

- [x] Currency picker displays all currencies
- [x] Currency conversion modal works correctly
- [x] Transactions save with proper currency data
- [x] Balance updates use converted amounts
- [x] Offline mode uses cached rates
- [x] Database migration runs successfully
- [x] UI displays conversion info correctly

## Future Enhancements

Potential future improvements:
- Account-level default currency setting
- Historical exchange rate tracking
- Multi-currency balance display
- Currency conversion reports
- Custom exchange rates (offline mode)

## Credits

Exchange rates provided by [MoneyConvert.net](https://moneyconvert.net/)
