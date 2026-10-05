package com.hexaware.portfolio.portfolio_backend.security;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;

class SecurityConfigTest {

    @Test
    void csrfRepositoryCreatesHttpOnlyLaxCookie() {
        SecurityConfig config = new SecurityConfig(mock(JwtAuthenticationFilter.class));
        CsrfTokenRepository repository = config.csrfTokenRepository();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        CsrfToken token = repository.generateToken(request);
        repository.saveToken(token, request, response);

        assertNotNull(token);
        assertTrue(response.getCookie("XSRF-TOKEN").isHttpOnly());
        assertTrue(response.getCookie("XSRF-TOKEN").getSecure() == false);
        assertTrue(response.getCookie("XSRF-TOKEN").getAttribute("SameSite").equals("Lax"));
    }
}
