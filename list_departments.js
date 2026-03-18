const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function listDepartments() {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/departments`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error fetching departments:', err);
    }
}

listDepartments();
