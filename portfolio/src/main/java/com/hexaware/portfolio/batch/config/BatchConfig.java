package com.hexaware.portfolio.batch.config;

import java.util.Collections;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.support.ListItemReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class BatchConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    public BatchConfig(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        this.jobRepository = jobRepository;
        this.transactionManager = transactionManager;
    }

    @Bean
    public Job priceLoadJob(Step priceLoadStep) {
        return new JobBuilder("priceLoadJob", jobRepository)
                .start(priceLoadStep)
                .build();
    }

    @Bean
    public Step priceLoadStep(ItemReader<Object> priceCsvReader,
                             ItemProcessor<Object, Object> priceProcessor,
                             ItemWriter<Object> dailyPriceWriter) {
        return new StepBuilder("priceLoadStep", jobRepository)
                .<Object, Object>chunk(500, transactionManager)
                .reader(priceCsvReader)
                .processor(priceProcessor)
                .writer(dailyPriceWriter)
                .build();
    }

    @Bean
    public ItemReader<Object> priceCsvReader() {
        return new ListItemReader<>(Collections.emptyList());
    }

    @Bean
    public ItemProcessor<Object, Object> priceProcessor() {
        return item -> item;
    }

    @Bean
    public ItemWriter<Object> dailyPriceWriter() {
        return items -> {
        };
    }
}
