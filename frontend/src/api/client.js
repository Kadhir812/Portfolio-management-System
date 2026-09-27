import axios from 'axios';

const client = axios.create({
	baseURL: import.meta.env.VITE_API_URL || '/api',
	headers: {
		'Content-Type': 'application/json'
	},
	timeout: 10000
});

client.interceptors.request.use((config) => {
	const token = localStorage.getItem('portfolio_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

client.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('portfolio_token');
			localStorage.removeItem('portfolio_user');
			if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
				window.location.assign('/login');
			}
		}
		const message = error.response?.data?.message
			|| error.response?.data?.error
			|| error.response?.data
			|| error.message;
		console.error('API request failed', {
			status: error.response?.status,
			url: error.config?.url,
			response: error.response?.data
		});
		return Promise.reject(new Error(typeof message === 'string' ? message : 'Request failed'));
	}
);

export const api = {
	auth: {
		register: async (payload) => (await client.post('/auth/register', payload)).data,
		login: async (payload) => (await client.post('/auth/login', payload)).data
	},
	portfolios: {
		list: async () => (await client.get('/portfolios')).data,
		get: async (portfolioId) => (await client.get(`/portfolios/${portfolioId}`)).data,
		create: async (payload) => (await client.post('/portfolios', payload)).data,
		update: async (portfolioId, payload) => (await client.put(`/portfolios/${portfolioId}`, payload)).data,
		remove: async (portfolioId) => client.delete(`/portfolios/${portfolioId}`)
	},
	themes: {
		list: async () => (await client.get('/themes')).data,
		get: async (portfolioId) => (await client.get(`/portfolios/${portfolioId}/theme`)).data,
		attach: async (portfolioId, theme) => (await client.put(`/portfolios/${portfolioId}/theme`, { theme })).data,
		remove: async (portfolioId) => client.delete(`/portfolios/${portfolioId}/theme`)
	},
	holdings: {
		list: async (portfolioId) => (await client.get(`/portfolios/${portfolioId}/holdings`)).data,
		summary: async (portfolioId) => (await client.get(`/portfolios/${portfolioId}/holdings/summary`)).data,
		eligibleSecurities: async (portfolioId) => (await client.get(`/portfolios/${portfolioId}/holdings/eligible-securities`)).data,
		add: async (portfolioId, payload) => (await client.post(`/portfolios/${portfolioId}/holdings`, payload)).data,
		update: async (portfolioId, holdingId, payload) => (await client.put(`/portfolios/${portfolioId}/holdings/${holdingId}`, payload)).data,
		remove: async (portfolioId, holdingId) => client.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`),
		save: async (portfolioId) => (await client.post(`/portfolios/${portfolioId}/holdings/save`)).data
	}
};
