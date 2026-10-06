package com.hexaware.portfolio.benchmark.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.hexaware.portfolio.benchmark.entity.BenchmarkIndex;
import com.hexaware.portfolio.benchmark.repository.BenchmarkIndexRepository;

class BenchmarkMetadataSeederTest {
    private BenchmarkIndexRepository repository;
    private BenchmarkMetadataSeeder seeder;

    @BeforeEach
    void setUp() {
        repository = mock(BenchmarkIndexRepository.class);
        seeder = new BenchmarkMetadataSeeder(repository);
    }

    @Test
    void seedsAllBenchmarkDefinitionsWhenMissing() {
        when(repository.findByIndexCode(anyString())).thenReturn(Optional.empty());
        when(repository.save(any(BenchmarkIndex.class))).thenAnswer(invocation -> invocation.getArgument(0));

        seeder.run();

        ArgumentCaptor<BenchmarkIndex> captor = ArgumentCaptor.forClass(BenchmarkIndex.class);
        verify(repository, org.mockito.Mockito.times(6)).save(captor.capture());
        List<String> codes = captor.getAllValues().stream().map(BenchmarkIndex::getIndexCode).toList();
        assertEquals(List.of("SP500", "NASDAQ100", "NIFTY50", "SENSEX", "FTSE100", "DAX"), codes);
        assertEquals("ACTIVE", captor.getAllValues().get(0).getStatus());
    }

    @Test
    void doesNotOverwriteExistingBenchmarkDefinitions() {
        when(repository.findByIndexCode(anyString())).thenReturn(Optional.of(new BenchmarkIndex()));

        seeder.run();

        verify(repository, never()).save(any(BenchmarkIndex.class));
    }
}