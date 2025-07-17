import axios from 'axios';


const API_BASE_URL = 'https://news-backend-jxwy.vercel.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


export default api;