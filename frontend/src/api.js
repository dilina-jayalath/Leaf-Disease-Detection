import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(config => {
    const tokens = localStorage.getItem('authTokens');
    if (tokens) {
        const parsedTokens = JSON.parse(tokens);
        config.headers.Authorization = `Bearer ${parsedTokens.access}`;
    }
    return config;
});

export default api;
