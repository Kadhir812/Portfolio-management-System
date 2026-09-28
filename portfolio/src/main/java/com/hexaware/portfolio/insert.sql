Yes. Your current Spring Batch design can continue using isin + trade_date as the business uniqueness key for EQUITY and MUTUAL.

But since we changed the database model to use security_id, I recommend gradually changing the price table to:

daily_prices
-----------------------------
id                  PK
security_id         FK
trade_date
...

with:

UNIQUE(security_id, trade_date)

Your existing batch

Currently you probably have something like:

CSV
 ↓
HistoricalPriceReader
 ↓
HistoricalPriceProcessor
      ↓
isin + tradeDate
 ↓
HistoricalPriceWriter
 ↓
stocks_daily_prices

You don't need to throw this away.

Change the processing logic to:

CSV
 ↓
Reader
 ↓
Processor
      ↓
find SecurityDetails using ISIN
      ↓
get security_id
      ↓
create DailyPrice
      ↓
Writer

For example:

SecurityDetails security =
    securityRepository.findByIsin(row.getIsin())
        .orElseThrow(...);

DailyPrice price = DailyPrice.builder()
    .securityId(security.getSecurityId())
    .tradeDate(row.getTradeDate())
    .openPrice(row.getOpenPrice())
    .highPrice(row.getHighPrice())
    .lowPrice(row.getLowPrice())
    .closePrice(row.getClosePrice())
    .valuationPrice(row.getClosePrice())
    .build();

And your database uniqueness becomes:

@UniqueConstraint(
    name = "uk_daily_price_security_date",
    columnNames = {"security_id", "trade_date"}
)

Why this is better

Your source data can still identify the instrument using:

ISIN + trade date

but your application database uses:

security_id + trade_date

So you don't need to redesign your CSV processing conceptually. You're just resolving the external ISIN into your internal ID during processing.

For example:

CSV
INE002A01018 | 2026-09-25 | 1450 | ...
        ↓
security_details
INE002A01018 → security_id = 101
        ↓
daily_prices
101 | 2026-09-25 | 1450 | ...

This will also let the same Spring Batch architecture later handle commodities, crypto, ETFs, etc., even when those assets don't have ISINs.
