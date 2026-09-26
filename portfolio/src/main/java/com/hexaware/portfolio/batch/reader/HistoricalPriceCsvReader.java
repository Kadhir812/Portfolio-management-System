package com.hexaware.portfolio.batch.reader;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.batch.item.ItemReader;

import com.hexaware.portfolio.batch.model.HistoricalPriceRow;

public class HistoricalPriceCsvReader implements ItemReader<HistoricalPriceRow>, AutoCloseable {

    private static final DateTimeFormatter TWO_DIGIT_YEAR_DATE_FORMAT = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("dd-MMM-")
            .appendValueReduced(ChronoField.YEAR, 2, 2, 2000)
            .toFormatter(Locale.ENGLISH);
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ofPattern("dd-MMM-uuuu", Locale.ENGLISH),
            TWO_DIGIT_YEAR_DATE_FORMAT);

    private final CSVParser parser;
    private final Iterator<CSVRecord> records;
    private final Map<String, String> headers = new HashMap<>();

    public HistoricalPriceCsvReader(Path file) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build();
        this.parser = CSVParser.parse(file, StandardCharsets.UTF_8, format);
        this.records = parser.iterator();
        parser.getHeaderMap().keySet().forEach(header -> headers.put(normalize(header), header));
    }

    @Override
    public HistoricalPriceRow read() {
        if (!records.hasNext()) {
            return null;
        }

        CSVRecord record = records.next();
        return new HistoricalPriceRow(
                value(record, "symbol"),
                value(record, "series"),
                parseDate(value(record, "date")),
                parseDecimal(value(record, "prevclose")),
                parseDecimal(value(record, "openprice")),
                parseDecimal(value(record, "highprice")),
                parseDecimal(value(record, "lowprice")),
                parseDecimal(value(record, "lastprice")),
                parseDecimal(value(record, "closeprice")));
    }

    private String value(CSVRecord record, String column) {
        String header = headers.get(column);
        if (header == null) {
            throw new IllegalArgumentException("Missing CSV column: " + column);
        }
        return record.get(header);
    }

    private static String normalize(String value) {
        return value.replaceAll("[^A-Za-z0-9]", "").toLowerCase(Locale.ROOT);
    }

    private static LocalDate parseDate(String value) {
        for (DateTimeFormatter format : DATE_FORMATS) {
            try {
                return LocalDate.parse(value, format);
            } catch (RuntimeException ignored) {
                // Try the next known NSE date format.
            }
        }
        throw new IllegalArgumentException("Invalid historical price date: " + value);
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.replace(",", "").trim());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Invalid price value: " + value, exception);
        }
    }

    @Override
    public void close() throws IOException {
        parser.close();
    }
}
