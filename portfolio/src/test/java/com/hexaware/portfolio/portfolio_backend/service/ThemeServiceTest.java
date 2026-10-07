package com.hexaware.portfolio.portfolio_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.hexaware.portfolio.portfolio_backend.dto.ThemeDefinitionResponse;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.exceptions.ThemeNotAttachedException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;
import com.hexaware.portfolio.portfolio_backend.security.AppUser;
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;

class ThemeServiceTest {
	private PortfolioRepository portfolios;
	private ThemeRepository themes;
	private CurrentUserService currentUser;
	private ThemeService service;
	private AppUser owner;

	@BeforeEach
	void setUp() {
		portfolios = mock(PortfolioRepository.class);
		themes = mock(ThemeRepository.class);
		currentUser = mock(CurrentUserService.class);
		service = new ThemeService(portfolios, themes, currentUser);
		owner = AppUser.builder().id(2L).username("investor").build();
	}

	@Test
	void listsThemeDefinitionsAndAllocationDetails() {
		ThemeDefinition theme = themeDefinition();
		when(themes.findAllByOrderByIdAsc()).thenReturn(List.of(theme));

		List<ThemeDefinitionResponse> result = service.getAllThemes();

		assertEquals(1, result.size());
		assertEquals(InvestmentThemes.CONSERVATIVE, result.get(0).theme());
		assertEquals(AssetClass.STOCKS, result.get(0).allocations().get(0).assetClass());
		assertEquals(new BigDecimal("40"), result.get(0).allocations().get(0).percentage());
	}

	@Test
	void attachThemeUpdatesAndSavesOwnedPortfolio() {
		Portfolio portfolio = ownedPortfolio(3L);
		stubOwnedPortfolio(portfolio);
		when(portfolios.save(portfolio)).thenReturn(portfolio);

		Portfolio result = service.attachTheme(3L, InvestmentThemes.AGGRESSIVE);

		assertEquals(InvestmentThemes.AGGRESSIVE, result.getTheme());
		verify(portfolios).save(portfolio);
	}

	@Test
	void attachThemeRequiresThemeAndExistingPortfolio() {
		assertThrows(PortfolioValidationException.class, () -> service.attachTheme(3L, null));
		assertThrows(PortfolioValidationException.class,
				() -> service.attachTheme(null, InvestmentThemes.AGGRESSIVE));

		when(currentUser.getCurrentUser()).thenReturn(owner);
		when(portfolios.findByIdAndOwnerUsername(99L, "investor")).thenReturn(Optional.empty());
		assertThrows(PortfolioNotFoundException.class,
				() -> service.attachTheme(99L, InvestmentThemes.AGGRESSIVE));
		verify(portfolios, never()).save(any(Portfolio.class));
	}

	@Test
	void attachedThemeRequiresPortfolioThemeAndConfiguration() {
		Portfolio unattached = ownedPortfolio(3L);
		stubOwnedPortfolio(unattached);
		assertThrows(ThemeNotAttachedException.class, () -> service.getAttachedTheme(3L));

		Portfolio attached = ownedPortfolio(4L);
		attached.setTheme(InvestmentThemes.CONSERVATIVE);
		when(portfolios.findByIdAndOwnerUsername(4L, "investor")).thenReturn(Optional.of(attached));
		assertThrows(PortfolioValidationException.class, () -> service.getAttachedTheme(4L));
	}

	@Test
	void removeThemeClearsAndSavesTheme() {
		Portfolio portfolio = ownedPortfolio(5L);
		portfolio.setTheme(InvestmentThemes.CONSERVATIVE);
		stubOwnedPortfolio(portfolio);

		service.removeTheme(5L);

		assertNull(portfolio.getTheme());
		verify(portfolios).save(portfolio);
	}

	@Test
	void deleteThemeRemovesThemeDefinitionWhenConfigured() {
		ThemeDefinition theme = themeDefinition();
		when(themes.findByTheme(InvestmentThemes.CONSERVATIVE)).thenReturn(Optional.of(theme));

		service.deleteTheme(InvestmentThemes.CONSERVATIVE);

		verify(themes).delete(theme);
	}

	private Portfolio ownedPortfolio(Long id) {
		return Portfolio.builder().id(id).owner(owner).build();
	}

	private void stubOwnedPortfolio(Portfolio portfolio) {
		when(currentUser.getCurrentUser()).thenReturn(owner);
		when(portfolios.findByIdAndOwnerUsername(portfolio.getId(), "investor"))
				.thenReturn(Optional.of(portfolio));
	}

	private ThemeDefinition themeDefinition() {
		ThemeDefinition theme = new ThemeDefinition();
		theme.setTheme(InvestmentThemes.CONSERVATIVE);
		theme.setLabel("Conservative");
		theme.setRisk("Low");
		theme.setInvestmentHorizon("Short term");
		ThemeAllocation allocation = new ThemeAllocation();
		allocation.setAssetClass(AssetClass.STOCKS);
		allocation.setPercentage(new BigDecimal("40"));
		theme.addAllocation(allocation);
		return theme;
	}
}