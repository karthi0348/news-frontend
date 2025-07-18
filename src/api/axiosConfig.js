import axios from 'axios';


const API_BASE_URL = 'https://bqhktxjd-8000.inc1.devtunnels.ms';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


export default api;