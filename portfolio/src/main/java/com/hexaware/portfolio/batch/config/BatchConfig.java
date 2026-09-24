package com.hexaware.portfolio.batch.config;

import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.ItemProcessor;
import org.springframework.batch.infrastructure.item.ItemReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.PlatformTransactionManager;

import com.hexaware.portfolio.batch.model.HistoricalPriceRow;
import com.hexaware.portfolio.batch.processor.HistoricalPriceProcessor;
import com.hexaware.portfolio.batch.reader.HistoricalPriceCsvReader;
import com.hexaware.portfolio.batch.writer.HistoricalPriceWriter;
import com.hexaware.portfolio.security.entity.DailyPrice;

import java.nio.file.Path;

@Configuration
public class BatchConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    public BatchConfig(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        this.jobRepository = jobRepository;
        this.transactionManager = transactionManager;
    }

    @Bean
    public Job historicalPriceImportJob(Step historicalPriceStep) {
        return new JobBuilder("historicalPriceImportJob", jobRepository)
                .start(historicalPriceStep)
                .build();
    }

    @Bean
    public Step historicalPriceStep(ItemReader<HistoricalPriceRow> historicalPriceReader,
            ItemProcessor<HistoricalPriceRow, DailyPrice> historicalPriceProcessor,
            HistoricalPriceWriter historicalPriceWriter) {
        return new StepBuilder("historicalPriceStep", jobRepository)
                .<HistoricalPriceRow, DailyPrice>chunk(500, transactionManager)
                .reader(historicalPriceReader)
                .processor(historicalPriceProcessor)
                .writer(historicalPriceWriter)
                .build();
    }

    @Bean
    @StepScope
    public HistoricalPriceCsvReader historicalPriceReader(
            @Value("#{jobParameters['inputFile']}") String inputFile) throws Exception {
        return new HistoricalPriceCsvReader(Path.of(inputFile));
    }

    @Bean
    @StepScope
    public HistoricalPriceProcessor historicalPriceProcessor(
            @Value("#{jobParameters['isin']}") String isin,
            @Value("#{jobParameters['symbol']}") String symbol,
            @Value("#{jobParameters['series']}") String series) {
        return new HistoricalPriceProcessor(isin, symbol, series);
    }
}
