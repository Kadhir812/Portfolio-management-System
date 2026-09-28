Use this prompt:

I am working on a Spring Boot Portfolio Management System with Spring Batch for importing historical asset prices.

I currently have these asset types:

EQUITY
MUTUAL
COMMODITY
BOND
CRYPTO
REIT
ETF
CASH

I want to change my database design to the following architecture:

1. COMMON MASTER TABLE: security_details

security_details
------------------------------------------------
security_id       BIGINT PK AUTO_INCREMENT
asset_type        VARCHAR(20) NOT NULL
isin              VARCHAR(12) UNIQUE NULL
symbol            VARCHAR(50) NULL
series            VARCHAR(10) NULL
name              VARCHAR(200) NOT NULL
description       VARCHAR(500) NULL
exchange          VARCHAR(30) NULL
currency          VARCHAR(10) NULL
sector            VARCHAR(100) NULL
industry          VARCHAR(100) NULL
logo_url          VARCHAR(500) NULL
website_url       VARCHAR(500) NULL
country           VARCHAR(100) NULL
market            VARCHAR(100) NULL
risk_level        VARCHAR(30) NULL
status            VARCHAR(20) NOT NULL
created_at        DATETIME
updated_at        DATETIME

The purpose of this table is to store master/details information for every asset so that the frontend can display rich information for each asset type.

ISIN should NOT be the primary key.
security_id should be the internal primary key.
ISIN should be nullable because not every asset type necessarily uses ISIN.

For EQUITY and MUTUAL, the source data currently uses ISIN.
For other assets, security_id should be the internal identifier.

2. COMMON DAILY PRICE TABLE

Use one common table for:
EQUITY
MUTUAL
COMMODITY
CRYPTO
ETF
REIT

daily_prices
------------------------------------------------
id                  BIGINT PK AUTO_INCREMENT
security_id         BIGINT NOT NULL FK
trade_date          DATE NOT NULL
open_price          DECIMAL(20,6) NULL
high_price          DECIMAL(20,6) NULL
low_price           DECIMAL(20,6) NULL
close_price         DECIMAL(20,6) NULL
prev_close          DECIMAL(20,6) NULL
last_price          DECIMAL(20,6) NULL
volume              BIGINT NULL
nav                 DECIMAL(20,6) NULL
spot_price          DECIMAL(20,6) NULL
valuation_price     DECIMAL(20,6) NULL

UNIQUE(security_id, trade_date)

valuation_price is the normalized price used by portfolio valuation and rebalancing:
- EQUITY → close price
- MUTUAL → NAV
- COMMODITY → spot price
- CRYPTO → market price
- ETF → close price
- REIT → close price

Keep nav and spot_price because I may need the original market data separately.

3. SEPARATE BOND TABLE

bond_details
------------------------------------------------
security_id             BIGINT PK/FK
issuer                  VARCHAR(200)
issuer_type             VARCHAR(50)
bond_name               VARCHAR(200)
bond_type               VARCHAR(50)
face_value              DECIMAL(20,6)
issue_price             DECIMAL(20,6)
coupon_rate             DECIMAL(10,6)
coupon_type             VARCHAR(30)
coupon_frequency        VARCHAR(30)
issue_date              DATE
maturity_date           DATE
yield_to_maturity       DECIMAL(10,6)
credit_rating           VARCHAR(20)
rating_agency           VARCHAR(100)
callable                BOOLEAN
puttable                BOOLEAN
minimum_investment      DECIMAL(20,6)
created_at              DATETIME
updated_at              DATETIME

security_details.security_id should be the primary/foreign key relationship for bond_details.

IMPORTANT:
Do not duplicate ISIN in bond_details because ISIN already exists in security_details.

--------------------------------------------------
CURRENT SPRING BATCH
--------------------------------------------------

My current HistoricalPriceRow is:

package com.hexaware.portfolio.batch.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HistoricalPriceRow(
        String symbol,
        String series,
        LocalDate tradeDate,
        BigDecimal prevClose,
        BigDecimal openPrice,
        BigDecimal highPrice,
        BigDecimal lowPrice,
        BigDecimal lastPrice,
        BigDecimal closePrice) {
}

My existing Spring Batch currently works with ISIN + trade date for historical stock data.

The CSV contains:
- symbol
- series
- date
- prevclose
- openprice
- highprice
- lowprice
- lastprice
- closeprice

The ISIN is currently passed as a Spring Batch job parameter rather than being part of HistoricalPriceRow.

I want to preserve this approach.

The new batch flow should be:

CSV
↓
HistoricalPriceCsvReader
↓
HistoricalPriceRow
↓
HistoricalPriceProcessor
↓
Use ISIN job parameter to find SecurityDetails
↓
Get security_id
↓
Create DailyPrice using security_id + trade_date
↓
HistoricalPriceWriter
↓
daily_prices

The source/external identity is still ISIN for stocks and mutual funds, but the database relationship should use security_id.

The database uniqueness for daily prices must change from:

ISIN + trade_date

to:

security_id + trade_date

--------------------------------------------------
CURRENT CODE
--------------------------------------------------

I currently have these classes:

1. HistoricalPriceRow
2. HistoricalPriceCsvReader
3. HistoricalPriceProcessor
4. HistoricalPriceWriter
5. BatchConfig
6. HistoricalPriceDirectoryRunner
7. SecurityDetails entity
8. DailyPrice entity
9. SecurityDetailsRepository
10. DailyPriceRepository

I will provide the existing files.

YOUR TASK:

Adapt my existing code to the new schema and batch architecture.

Requirements:

1. Do NOT rewrite the entire application unnecessarily.
2. Preserve the existing Spring Batch architecture.
3. Preserve the existing CSV reader behavior.
4. Preserve the existing job parameters:
   - inputFile
   - isin
   - symbol
   - series
5. Keep HistoricalPriceRow unchanged unless a change is genuinely required.
6. Change SecurityDetails so security_id is the primary key instead of ISIN.
7. Keep ISIN as a unique nullable field.
8. Add the master/detail fields shown above to SecurityDetails.
9. Change DailyPrice so it uses security_id instead of ISIN.
10. Rename the conceptual table from stocks_daily_prices to daily_prices.
11. Add the unique constraint:
    UNIQUE(security_id, trade_date)
12. Add valuation_price, nav and spot_price to DailyPrice.
13. Create BondDetails as a separate entity with security_id as PK/FK.
14. Update SecurityDetailsRepository so I can find a security using ISIN.
15. Update DailyPriceRepository so I can find a daily price using:
    securityId + tradeDate
16. Update HistoricalPriceProcessor:
    - receive ISIN from the job parameter
    - find SecurityDetails using findByIsin()
    - obtain securityId
    - create DailyPrice with securityId
    - set tradeDate
    - map all existing price fields
    - for EQUITY, set valuationPrice = closePrice
17. Update HistoricalPriceWriter:
    - stop using findByIsinAndTradeDate()
    - use findBySecurityIdAndTradeDate()
    - save securityId + tradeDate
    - update all price fields
18. Update HistoricalPriceDirectoryRunner:
    - save/find SecurityDetails using findByIsin()
    - no longer use findById(isin)
    - preserve the existing ISIN validation
    - continue passing ISIN as a job parameter
19. Update BatchConfig only where required.
20. Show all changed files completely, not just snippets.
21. Clearly mark NEW, MODIFIED, and UNCHANGED files.
22. Give the required SQL schema for:
    - security_details
    - daily_prices
    - bond_details
23. Explain any migration required from:
    stocks_master → security_details
    stocks_daily_prices → daily_prices
24. Do not invent fields in my existing CSV.
25. Do not change the CSV reader unless required.
26. Make the code compile with the existing Spring Batch/Spring Boot style shown in my files.
27. Use JPA mappings correctly, especially the security_id foreign key.
28. Avoid duplicate physical/logical column mappings that could cause Hibernate errors.
29. Explain exactly how one CSV row flows through:
    ISIN → security_details → security_id → daily_prices.
30. Mention any other existing files that must be changed because of the schema change.

Give the final answer in this order:

A. Final database schema
B. Entity changes
C. Repository changes
D. HistoricalPriceProcessor
E. HistoricalPriceWriter
F. BatchConfig
G. HistoricalPriceDirectoryRunner
H. SQL migration/schema
I. Complete final code for every changed file
J. Final batch flow
K. List of files that remain unchanged
