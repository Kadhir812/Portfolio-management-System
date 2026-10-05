package com.hexaware.portfolio.portfolio_backend.security;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.security.web.csrf.CsrfToken;

class AuthControllerTest {

    @Test
    void csrfTokenEndpointReturnsSpringSecurityToken() {
        AuthController controller = new AuthController(mock(AuthService.class));
        CsrfToken token = mock(CsrfToken.class);

        assertSame(token, controller.csrfToken(token));
    }
}
