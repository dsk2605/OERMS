const API_URL = 'http://localhost:5000/api'; 

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error || 'API Request Failed');
    }
    return data;
};

export const apiService = {
    // --- Auth Service ---
    login: (email, password) => 
        fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }).then(handleResponse),

    register: (name, email, password, role) => 
        fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        }).then(handleResponse),

    // --- Faculty Service (Question Creation - FR3) ---
    createQuestion: (questionData) =>
        fetch(`${API_URL}/faculty/questions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(questionData)
        }).then(handleResponse),
    
    // --- Student Service (Exam Delivery - FR5/FR8/FR10) ---
    startExam: (examId) =>
        fetch(`${API_URL}/student/exams/${examId}/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
        }).then(handleResponse),

    submitExam: (instanceId, responses) =>
        fetch(`${API_URL}/student/exams/${instanceId}/submit`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ responses })
        }).then(handleResponse),
    
    // --- Proctoring Log (Simulated) ---
    logViolation: (instanceId, violationData) =>
        fetch(`${API_URL}/proctor/${instanceId}/log`, { // Placeholder API
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(violationData)
        }).then(handleResponse),
};