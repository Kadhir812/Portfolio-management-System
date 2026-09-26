const API_BASE = 'http://localhost:8080/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  portfolios: {
    list: () => request('/portfolios'),
    get: (id) => request(`/portfolios/${id}`),
    create: (data) => request('/portfolios', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/portfolios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/portfolios/${id}`, { method: 'DELETE' })
  },
  themes: {
    list: () => request('/themes'),
    attach: (portfolioId, theme) => request(`/portfolios/${portfolioId}/theme`, {
      method: 'PUT',
      body: JSON.stringify({ theme })
    }),
    get: (portfolioId) => request(`/portfolios/${portfolioId}/theme`),
    remove: (portfolioId) => request(`/portfolios/${portfolioId}/theme`, { method: 'DELETE' })
  },
  holdings: {
    list: (portfolioId) => request(`/portfolios/${portfolioId}/holdings`),
    eligible: (portfolioId) => request(`/portfolios/${portfolioId}/holdings/eligible-securities`),
    add: (portfolioId, data) => request(`/portfolios/${portfolioId}/holdings`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    save: (portfolioId) => request(`/portfolios/${portfolioId}/holdings/save`, { method: 'POST' }),
    remove: (portfolioId, holdingId) => request(`/portfolios/${portfolioId}/holdings/${holdingId}`, { method: 'DELETE' })
  }
};
