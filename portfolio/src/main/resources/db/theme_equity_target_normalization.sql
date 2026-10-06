-- Normalize the existing theme equity splits to percentages within the stock allocation.
-- Category proportions retain their configured relative weights and total 100% per theme.
UPDATE theme_equity_allocations allocation
JOIN investment_themes theme ON theme.id = allocation.theme_id
SET allocation.percentage = CASE theme.theme_code
    WHEN 'CONSERVATIVE' THEN CASE allocation.equity_category
        WHEN 'LARGE_CAP' THEN 66.67
        WHEN 'MID_CAP' THEN 26.66
        WHEN 'SMALL_CAP' THEN 6.67
    END
    WHEN 'MODERATELY_CONSERVATIVE' THEN CASE allocation.equity_category
        WHEN 'LARGE_CAP' THEN 60.00
        WHEN 'MID_CAP' THEN 28.00
        WHEN 'SMALL_CAP' THEN 12.00
    END
    WHEN 'AGGRESSIVE' THEN CASE allocation.equity_category
        WHEN 'LARGE_CAP' THEN 55.56
        WHEN 'MID_CAP' THEN 28.89
        WHEN 'SMALL_CAP' THEN 15.55
    END
    WHEN 'MODERATELY_AGGRESSIVE' THEN CASE allocation.equity_category
        WHEN 'LARGE_CAP' THEN 45.45
        WHEN 'MID_CAP' THEN 32.73
        WHEN 'SMALL_CAP' THEN 21.82
    END
    WHEN 'VERY_AGGRESSIVE' THEN CASE allocation.equity_category
        WHEN 'LARGE_CAP' THEN 35.29
        WHEN 'MID_CAP' THEN 35.29
        WHEN 'SMALL_CAP' THEN 29.42
    END
END
WHERE theme.theme_code IN (
    'CONSERVATIVE',
    'MODERATELY_CONSERVATIVE',
    'AGGRESSIVE',
    'MODERATELY_AGGRESSIVE',
    'VERY_AGGRESSIVE'
)
AND allocation.equity_category IN ('LARGE_CAP', 'MID_CAP', 'SMALL_CAP');
