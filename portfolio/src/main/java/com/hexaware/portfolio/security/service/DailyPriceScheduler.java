package com.hexaware.portfolio.security.service;

import java.math.BigDecimal;
import java.io.StringReader;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class DailyPriceScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(DailyPriceScheduler.class);
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd-MMM-uuuu", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("dd-MMM-yy", Locale.ENGLISH));

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final SecurityDetailsRepository securityDetailsRepository;
    private final DailyPriceRepository dailyPriceRepository;
    private final String apiUrl;
    private final ZoneId zoneId;

    public DailyPriceScheduler(
            ObjectMapper objectMapper,
            SecurityDetailsRepository securityDetailsRepository,
            DailyPriceRepository dailyPriceRepository,
            @Value("${daily-price.api-url:}") String apiUrl,
            @Value("${daily-price.zone:Asia/Kolkata}") String zone) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
        this.securityDetailsRepository = securityDetailsRepository;
        this.dailyPriceRepository = dailyPriceRepository;
        this.apiUrl = apiUrl.trim();
        this.zoneId = ZoneId.of(zone);
    }

    @Scheduled(cron = "${daily-price.cron:0 15 15 * * MON-FRI}", zone = "${daily-price.zone:Asia/Kolkata}")
    public void fetchDailyPrices() {
        if (apiUrl.isBlank()) {
            LOGGER.debug("Daily price scheduler is disabled because daily-price.api-url is blank");
            return;
        }

        for (SecurityDetails security : securityDetailsRepository.findAll()) {
            try {
                importSecurity(security);
            } catch (Exception exception) {
                LOGGER.error("Daily price import failed for {}", security.getSymbolAndSeries(), exception);
            }
        }
    }

    private void importSecurity(SecurityDetails security) throws Exception {
        String url = apiUrl
                .replace("{isin}", security.getIsin())
                .replace("{symbol}", security.getSymbol())
            .replace("{series}", security.getSeries())
            .replace("{from}", requestDate())
            .replace("{to}", requestDate());
        String payload = restClient.get()
                .uri(url)
            .header("User-Agent", "Mozilla/5.0")
            .header("Referer", "https://www.nseindia.com/")
            .accept(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN, MediaType.ALL)
                .retrieve()
                .body(String.class);

        List<DailyPrice> incomingRows = payload.trim().startsWith("{") || payload.trim().startsWith("[")
            ? jsonRows(payload, security)
            : csvRows(payload, security);
        for (DailyPrice incoming : incomingRows) {
            DailyPrice stored = dailyPriceRepository
                    .findByIsinAndTradeDate(incoming.getIsin(), incoming.getTradeDate())
                    .orElseGet(DailyPrice::new);
            copyValues(incoming, stored);
            dailyPriceRepository.save(stored);
        }
    }

    private String requestDate() {
        return LocalDate.now(zoneId).format(DateTimeFormatter.ofPattern("dd-MM-uuuu"));
    }

    private List<DailyPrice> jsonRows(String payload, SecurityDetails security) throws Exception {
        JsonNode root = objectMapper.readTree(payload);
        List<DailyPrice> rows = new ArrayList<>();
        for (JsonNode item : records(root)) {
            rows.add(toDailyPrice(item, security.getIsin()));
        }
        return rows;
    }

    private List<DailyPrice> csvRows(String payload, SecurityDetails security) throws Exception {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .get();
        try (CSVParser parser = CSVParser.parse(new StringReader(payload), format)) {
            Map<String, String> headers = new HashMap<>();
            parser.getHeaderMap().keySet().forEach(header -> headers.put(normalize(header), header));
            List<DailyPrice> rows = new ArrayList<>();
            for (CSVRecord record : parser) {
                String symbol = value(record, headers, "symbol");
                String series = value(record, headers, "series");
                if (!security.getSymbol().equalsIgnoreCase(symbol)
                        || !security.getSeries().equalsIgnoreCase(series)) {
                    continue;
                }
                rows.add(DailyPrice.builder()
                        .isin(security.getIsin())
                        .tradeDate(parseDate(value(record, headers, "date")))
                        .prevClose(decimal(value(record, headers, "prevclose")))
                        .openPrice(decimal(value(record, headers, "openprice")))
                        .highPrice(decimal(value(record, headers, "highprice")))
                        .lowPrice(decimal(value(record, headers, "lowprice")))
                        .lastPrice(decimal(value(record, headers, "lastprice")))
                        .closePrice(decimal(value(record, headers, "closeprice")))
                        .volume(longValue(value(record, headers, "totaltradedquantity")))
                        .build());
            }
            return rows;
        }
    }

    private static String value(CSVRecord record, Map<String, String> headers, String column) {
        String header = headers.get(column);
        if (header == null) {
            throw new IllegalArgumentException("NSE payload has no CSV column: " + column);
        }
        return record.get(header);
    }

    private static String normalize(String value) {
        return value.replaceAll("[^A-Za-z0-9]", "").toLowerCase(Locale.ROOT);
    }

    private List<JsonNode> records(JsonNode root) {
        JsonNode data = root.has("data") ? root.get("data") : root;
        List<JsonNode> records = new ArrayList<>();
        if (data.isArray()) {
            data.forEach(records::add);
        } else if (data.isObject()) {
            records.add(data);
        }
        return records;
    }

    private DailyPrice toDailyPrice(JsonNode item, String isin) {
        String date = text(item, "date", "tradeDate", "trade_date");
        if (date == null) {
            throw new IllegalArgumentException("Daily price payload has no trade date");
        }
        return DailyPrice.builder()
                .isin(isin)
                .tradeDate(parseDate(date))
                .prevClose(decimal(item, "prevClose", "prev_close", "previousClose"))
                .openPrice(decimal(item, "openPrice", "open_price", "open"))
                .highPrice(decimal(item, "highPrice", "high_price", "high"))
                .lowPrice(decimal(item, "lowPrice", "low_price", "low"))
                .lastPrice(decimal(item, "lastPrice", "last_price", "last"))
                .closePrice(decimal(item, "closePrice", "close_price", "close"))
                .volume(longValue(item, "volume", "totalTradedQuantity"))
                .nav(decimal(item, "nav"))
                .build();
    }

    private static void copyValues(DailyPrice source, DailyPrice target) {
        target.setIsin(source.getIsin());
        target.setTradeDate(source.getTradeDate());
        target.setPrevClose(source.getPrevClose());
        target.setOpenPrice(source.getOpenPrice());
        target.setHighPrice(source.getHighPrice());
        target.setLowPrice(source.getLowPrice());
        target.setLastPrice(source.getLastPrice());
        target.setClosePrice(source.getClosePrice());
        target.setVolume(source.getVolume());
        target.setNav(source.getNav());
    }

    private static String text(JsonNode item, String... names) {
        for (String name : names) {
            JsonNode value = item.get(name);
            if (value != null && !value.isNull() && !value.asText().isBlank()) {
                return value.asText();
            }
        }
        return null;
    }

    private static BigDecimal decimal(JsonNode item, String... names) {
        String value = text(item, names);
        return decimal(value);
    }

    private static Long longValue(JsonNode item, String... names) {
        String value = text(item, names);
        return longValue(value);
    }

    private static BigDecimal decimal(String value) {
        return value == null || value.isBlank() ? null : new BigDecimal(value.replace(",", "").trim());
    }

    private static Long longValue(String value) {
        return value == null || value.isBlank() ? null : Long.valueOf(value.replace(",", "").trim());
    }

    private static LocalDate parseDate(String value) {
        for (DateTimeFormatter formatter : DATE_FORMATS) {
            try {
                return LocalDate.parse(value.trim(), formatter);
            } catch (DateTimeParseException ignored) {

            }
        }
        throw new IllegalArgumentException("Unsupported daily price date: " + value);
    }
}
