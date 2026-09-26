package com.hexaware.portfolio.batch.runner;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Component
@ConditionalOnProperty(name = "batch.historical-import.enabled", havingValue = "true", matchIfMissing = false)
public class HistoricalPriceDirectoryRunner implements ApplicationRunner {

    private static final List<SecurityImport> IMPORTS = List.of(
            new SecurityImport(
                    Path.of("./src/main/java/com/hexaware/portfolio/batch/data/23-09-2024-TO-24-09-2026-TCS-ALL-N.csv"),
                    "INE467B01029", "TCS", "Tata Consultancy Services"));


    private final JobLauncher jobLauncher;
    private final Job historicalPriceImportJob;
    private final SecurityDetailsRepository securityDetailsRepository;

    public HistoricalPriceDirectoryRunner(
            JobLauncher jobLauncher,
            @Qualifier("historicalPriceImportJob") Job historicalPriceImportJob,
            SecurityDetailsRepository securityDetailsRepository) {
        this.jobLauncher = jobLauncher;
        this.historicalPriceImportJob = historicalPriceImportJob;
        this.securityDetailsRepository = securityDetailsRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        for (SecurityImport security : IMPORTS) {
            importSecurity(security);
        }
    }

    private void importSecurity(SecurityImport security) throws Exception {
        if (!Files.isRegularFile(security.file())) {
            throw new IllegalStateException("Historical price file not found: " + security.file().toAbsolutePath());
        }
        saveSecurityDetails(security);

        JobParameters parameters = new JobParametersBuilder()
                .addString("inputFile", security.file().toAbsolutePath().toString())
                .addString("isin", security.isin())
                .addString("symbol", security.symbol())
                .addString("series", "EQ")
                .addLong("runId", System.currentTimeMillis())
                .toJobParameters();
        JobExecution execution = jobLauncher.run(historicalPriceImportJob, parameters);
        waitForCompletion(execution);
        if (execution.getStatus().isUnsuccessful()) {
            Throwable cause = execution.getAllFailureExceptions().stream().findFirst().orElse(null);
            throw new IllegalStateException("Historical price import failed for " + security.symbol(), cause);
        }
    }

    private void waitForCompletion(JobExecution execution) throws InterruptedException {
        while (execution.isRunning()) {
            Thread.sleep(100);
        }
    }

    private void saveSecurityDetails(SecurityImport security) {
        validateIsin(security.isin());
        SecurityDetails details = securityDetailsRepository.findById(security.isin())
                .orElseGet(SecurityDetails::new);
        details.setIsin(security.isin());
        details.setSymbol(security.symbol());
        details.setSeries("EQ");
        details.setDescription(security.description());
        details.setAssetType(AssetType.EQUITY);
        securityDetailsRepository.save(details);
    }

    private void validateIsin(String isin) {
        if (isin == null || !isin.matches("[A-Z]{2}[A-Z0-9]{9}[0-9]")) {
            throw new IllegalArgumentException("Invalid ISIN: " + isin
                    + ". Expected a 12-character ISIN such as INE860A01027");
        }
    }

    private record SecurityImport(Path file, String isin, String symbol, String description) {
    }
}
