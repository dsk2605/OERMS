import React, { useState, useEffect, useCallback, useRef } from 'react';
// Note: This file simulates a React/Tailwind environment for a professional submission.

// --- [1] REPLACED apiService ---
// This is the new, complete API service with all our hierarchy functions
const isValidEmailDomain = (email) => {
    if (!email || !email.includes('@')) {
        return false; // Basic check if it's even an email
    }
    return email.toLowerCase().endsWith(`@${REQUIRED_DOMAIN}`);
};
const API_URL = 'http://localhost:5000/api';
const REQUIRED_DOMAIN = 'sakec.ac.in'; // <-- ADD THIS
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};
const handleResponse = async (response) => {
    const data = await response.json();
    if (response.status === 202) {
        return { ...data, mustChangePassword: true, token: data.token };
    }
    if (!response.ok) {
        throw new Error(data.message || data.error || 'API Request Failed');
    }
    return data;
};

// Replace your entire apiService object with this corrected version

const apiService = {
    // --- Auth --- (Keep unchanged)
    login: (email, password, facultyCode) =>
        fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, facultyCode }) }).then(handleResponse),
    register: (name, email, password) =>
        fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) }).then(handleResponse),
    changePassword: (oldPassword, newPassword) =>
        fetch(`${API_URL}/auth/change-password`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ oldPassword, newPassword }) }).then(handleResponse),

    // --- Student APIs --- (Keep unchanged)
    getFacultyList: () =>
        fetch(`${API_URL}/student/faculty-list`, { headers: getAuthHeaders() }).then(handleResponse),
    requestFaculty: (facultyId) =>
        fetch(`${API_URL}/student/request-faculty/${facultyId}`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse),
    startExam: (examId) =>
        fetch(`${API_URL}/student/exams/${examId}/start`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse),
    submitExam: (instanceId, responses) =>
        fetch(`${API_URL}/student/exams/${instanceId}/submit`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ responses }) }).then(handleResponse),
    getMyApprovedFaculty: () => 
        fetch(`${API_URL}/student/my-faculty`, { headers: getAuthHeaders() }).then(handleResponse),
    getExamInstanceQuestions: (instanceId) =>
        fetch(`${API_URL}/student/exam-instance/${instanceId}/questions`, { headers: getAuthHeaders() }).then(handleResponse),
    getExamsByFaculty: (facultyId) => 
        fetch(`${API_URL}/student/exams-by-faculty/${facultyId}`, { headers: getAuthHeaders() }).then(handleResponse),
    
    logViolation: (instanceId, violationType) =>
        fetch(`${API_URL}/proctor/${instanceId}/log`, { 
            method: 'POST', 
            headers: getAuthHeaders(), 
            body: JSON.stringify({ type: violationType, timestamp: new Date() }) 
        }).then(handleResponse).catch(console.error),
    
    // getMyExams: () => // This one is likely no longer needed if using getExamsByFaculty
    //    fetch(`${API_URL}/student/my-exams`, { headers: getAuthHeaders() }).then(handleResponse),

    // --- Faculty APIs ---
    // Hierarchy & Student Mgmt (Keep unchanged)
    getHODList: () =>
        fetch(`${API_URL}/faculty/hod-list`, { headers: getAuthHeaders() }).then(handleResponse),
    requestHOD: (hodId) =>
        fetch(`${API_URL}/faculty/request-hod/${hodId}`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse),
    getStudentRequests: () =>
        fetch(`${API_URL}/faculty/student-requests`, { headers: getAuthHeaders() }).then(handleResponse),
    manageStudentRequest: (affiliationId, newStatus) =>
        fetch(`${API_URL}/faculty/manage-request/${affiliationId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ newStatus }) }).then(handleResponse),
    getMyStudents: () =>
        fetch(`${API_URL}/faculty/my-students`, { headers: getAuthHeaders() }).then(handleResponse),
    provisionStudent: (studentName, studentEmail, collegeId) =>
        fetch(`${API_URL}/faculty/students/provision`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ studentName, studentEmail, collegeId }) }).then(handleResponse),
    bulkProvisionStudents: (emails) =>
        fetch(`${API_URL}/faculty/students/bulk-provision`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ emails }) }).then(handleResponse),
    
    // Exam Management (Keep unchanged, createExam correctly has no blueprint)
    createExam: (examData) => 
        fetch(`${API_URL}/faculty/exams`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(examData) }).then(handleResponse),
    updateExam: (examId, examData) => 
        fetch(`${API_URL}/faculty/exams/${examId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(examData) }).then(handleResponse),
    deleteExam: (examId) => 
        fetch(`${API_URL}/faculty/exams/${examId}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse),
    getMyCreatedExams: () => 
        fetch(`${API_URL}/faculty/my-exams`, { headers: getAuthHeaders() }).then(handleResponse),

    // --- Exam-Specific Question Management (CORRECTED/ADDED) ---
    createQuestion: (examId, questionData) => // MODIFIED: Needs examId, new URL
        fetch(`${API_URL}/faculty/exams/${examId}/questions`, { 
            method: 'POST', 
            headers: getAuthHeaders(), 
            body: JSON.stringify(questionData) 
        }).then(handleResponse),
    getExamQuestions: (examId) => // <-- NEW
        fetch(`${API_URL}/faculty/exams/${examId}/questions`, { headers: getAuthHeaders() }).then(handleResponse),
    updateExamQuestion: (examId, questionId, questionData) => // <-- NEW
        fetch(`${API_URL}/faculty/exams/${examId}/questions/${questionId}`, { 
            method: 'PUT', 
            headers: getAuthHeaders(), 
            body: JSON.stringify(questionData) 
        }).then(handleResponse),
    deleteExamQuestion: (examId, questionId) => // <-- NEW
        fetch(`${API_URL}/faculty/exams/${examId}/questions/${questionId}`, { 
            method: 'DELETE', 
            headers: getAuthHeaders() 
        }).then(handleResponse),
    // --- End Question Management ---

    // Results Viewing (Moved here for Faculty context)
    getExamSubmissions: () => 
        fetch(`${API_URL}/faculty/submissions`, { headers: getAuthHeaders() }).then(handleResponse),
        
    // --- HOD (Admin) APIs --- (Keep unchanged)
    setFacultyCode: (codeValue) =>
        fetch(`${API_URL}/admin/code/faculty`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ codeValue }) }).then(handleResponse),
    getFacultyCode: () =>
        fetch(`${API_URL}/admin/code/faculty`, { headers: getAuthHeaders() }).then(handleResponse),
    provisionStaff: (name, email, password, role) =>
        fetch(`${API_URL}/admin/user/register`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name, email, password, role }) }).then(handleResponse),
    getFacultyRequests: () =>
        fetch(`${API_URL}/admin/faculty-requests`, { headers: getAuthHeaders() }).then(handleResponse),
    manageFacultyRequest: (affiliationId, newStatus) =>
        fetch(`${API_URL}/admin/manage-request/${affiliationId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ newStatus }) }).then(handleResponse),
    getMyFaculty: () =>
        fetch(`${API_URL}/admin/my-faculty`, { headers: getAuthHeaders() }).then(handleResponse),
    getMyStudents_Inherited: () =>
        fetch(`${API_URL}/admin/my-students`, { headers: getAuthHeaders() }).then(handleResponse),
};


// --- Shared Components (UNCHANGED) ---

const Header = ({ user, onLogout }) => (
    <div className="bg-gray-900 p-4 shadow-2xl flex justify-between items-center text-white sticky top-0 z-10">
        <h1 className="text-2xl font-extrabold tracking-wide">OERMS {user ? user.role.toUpperCase() : ''} Portal</h1>
        {user ? (
            <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-indigo-300">Logged in as: {user.email} ({user.role.toUpperCase()})</span>
                <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition duration-150 shadow-md">
                    Logout
                </button>
            </div>
        ) : (
            <span className="text-sm text-gray-400">Secure Examination System</span>
        )}
    </div>
);


const AuthForm = ({ onAuthSuccess, onPasswordResetRequired }) => {
    // State to manage input values and view
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [facultyCode, setFacultyCode] = useState('');
    const [role, setRole] = useState('student'); // Default role selected
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFacultyRegisterView, setIsFacultyRegisterView] = useState(false); // Only Faculty can toggle this

    // Determine view states based on role
    const isStudent = role === 'student';
    const isFaculty = role === 'faculty';
    const isAdminOrHOD = role === 'admin';

    // Conditional UI flags
    const showRegisterOption = isFaculty; // Only Faculty role allows toggling registration view
    const showNameInput = isFaculty && isFacultyRegisterView; // Only for Faculty registration
    const needsCodeForLogin = isFaculty && !isFacultyRegisterView; // Only Faculty LOGIN needs the code


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        if (!isValidEmailDomain(email)) {
            setMessage(`Error: Email must end with @${REQUIRED_DOMAIN}`);
            setLoading(false);
            return; 
        }

        try {
            let result;

            if (isFacultyRegisterView) {
                // FACULTY REGISTRATION PATH (Backend assigns role based on HODsList)
                result = await apiService.register(name, email, password);
                setMessage(`Registration successful. Account created. Please log in.`);
                setIsFacultyRegisterView(false); // Switch back to login after registration
            } else {
                // LOGIN PATH (STUDENT, FACULTY, HOD)
                const codeToSend = needsCodeForLogin ? facultyCode : undefined;
                result = await apiService.login(email, password, codeToSend);

                // Check for Mandatory Password Reset (Student Onboarding)
                if (result.mustChangePassword) {
                    onPasswordResetRequired({ email, token: result.token }); // Pass token needed for reset API
                    setMessage('Redirecting to compulsory password change screen...');
                    return; // Stop further processing
                }

                // Standard Successful Login
                localStorage.setItem('token', result.token);
                const payload = JSON.parse(atob(result.token.split('.')[1]));
                onAuthSuccess({ id: payload.id, role: result.role, email: email });
            }

        } catch (error) {
            setMessage(`Login/Registration Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl border-t-4 border-indigo-600">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">
                OERMS {isFacultyRegisterView ? 'Faculty Registration' : 'Portal Login'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* 1. Role Selection (Always visible) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Access Portal As:</label>
                    <div className="flex space-x-4 justify-around p-3 border rounded-lg bg-gray-50">
                        <label className="flex items-center">
                            <input type="radio" value="student" checked={isStudent} onChange={() => setRole('student')} className="form-radio text-indigo-600" />
                            <span className="ml-2 font-medium">Student</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" value="faculty" checked={isFaculty} onChange={() => setRole('faculty')} className="form-radio text-indigo-600" />
                            <span className="ml-2 font-medium">Faculty</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" value="admin" checked={isAdminOrHOD} onChange={() => setRole('admin')} className="form-radio text-indigo-600" />
                            <span className="ml-2 font-medium">HOD/Admin</span>
                        </label>
                    </div>
                </div>

                {/* 2. Credentials */}
                {showNameInput && (
                    <input type="text" placeholder="Full Name (Faculty)" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 border rounded-lg" />
                )}
                <input type="email" placeholder="College Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border rounded-lg" />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 border rounded-lg" />

                {/* 3. Faculty Code Input (Only for Faculty LOGIN) */}
                {needsCodeForLogin && (
                    <input type="password" placeholder="Unique Faculty Login Code (Set by HOD)" value={facultyCode} onChange={(e) => setFacultyCode(e.target.value)} required className="w-full p-3 border border-red-400 rounded-lg focus:ring-red-500" />
                )}

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-3 rounded-lg transition duration-150 shadow-md">
                    {loading ? 'Processing...' : isFacultyRegisterView ? 'Register Faculty' : 'Log In'}
                </button>
            </form>

            {/* 4. Toggle Button (Only visible for Faculty) */}
            {showRegisterOption && (
                <div className="mt-4 text-sm text-center">
                    <button
                        type="button"
                        onClick={() => setIsFacultyRegisterView(!isFacultyRegisterView)}
                        className="text-indigo-600 hover:underline font-semibold"
                    >
                        {isFacultyRegisterView ? 'Already Registered? Login' : 'First time Faculty? Register'}
                    </button>
                </div>
            )}

            {message && <p className={`mt-4 text-sm text-center ${message.startsWith('Error') || message.includes('Forbidden') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        </div>
    );
};


// --- MANDATORY PASSWORD RESET COMPONENT (UNCHANGED) ---
const PasswordResetForm = ({ email, token, handleSuccess }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            // Temporarily set the token to authorize the password change API call
            localStorage.setItem('token', token);
            await apiService.changePassword(oldPassword, newPassword);
            localStorage.removeItem('token'); // Important: Remove temporary token
            handleSuccess('Password successfully updated. Please log in with your new password.');
        } catch (error) {
            setMessage(`Password Change Error: ${error.message}`);
        } finally {
            setLoading(false);
            localStorage.removeItem('token'); // Ensure token is cleared on error too
        }
    };

    return (
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl border-t-4 border-red-600">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Compulsory Password Reset</h2>
            <p className="text-gray-700 mb-6">Welcome, **{email}**. For security, you must set a new personal password.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" placeholder="Default/Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="w-full p-3 border rounded-lg" />
                <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full p-3 border rounded-lg" />
                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold p-3 rounded-lg transition duration-150 shadow-md">
                    {loading ? 'Updating...' : 'Set New Password'}
                </button>
            </form>
            {message && <p className="mt-4 text-sm text-red-500">{message}</p>}
        </div>
    );
};

// Add this new component definition in App.jsx (e.g., after the Table component)

const QuestionAuthoringFormForExam = ({ examId, onQuestionAdded }) => {
    // --- State Variables ---
    const [qText, setQText] = useState('');
    const [qType, setQType] = useState('MCQ'); 
    const [qDifficulty, setQDifficulty] = useState('Easy'); // Optional
    const [qTags, setQTags] = useState(''); // Optional
    const [qOption1, setQOption1] = useState('');
    const [qOption2, setQOption2] = useState('');
    const [qOption3, setQOption3] = useState('');
    const [qOption4, setQOption4] = useState('');
    const [qCorrectOption, setQCorrectOption] = useState('1'); 
    const [qFormMessage, setQFormMessage] = useState('');
    const [isQLoading, setIsQLoading] = useState(false);

    const isMCQ = qType === 'MCQ';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setQFormMessage('');
        setIsQLoading(true);

        const tagsArray = qTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        let questionData = {
            text: qText,
            type: qType,
            difficulty: qDifficulty, // Pass if kept in model
            tags: tagsArray,       // Pass if kept in model
        };
        
        if (isMCQ) {
            const options = [qOption1, qOption2, qOption3, qOption4].filter(opt => opt.trim() !== '');
            if (options.length < 2) {
                setQFormMessage("Error: MCQ requires at least two options.");
                setIsQLoading(false);
                return;
            }
            questionData.options = options;
            questionData.correctOption = options[parseInt(qCorrectOption, 10) - 1]; 
        }

        try {
            // CALL THE MODIFIED API SERVICE FUNCTION (pass examId)
            const result = await apiService.createQuestion(examId, questionData); 
            setQFormMessage(`Success! Question added to this exam.`);
            // Clear form
            setQText('');
            setQTags('');
            setQDifficulty('Easy'); // Reset optional fields too
            setQOption1(''); setQOption2(''); setQOption3(''); setQOption4('');
            setQCorrectOption('1');
            onQuestionAdded(); // Notify parent (ExamQuestionManager) to refresh list
        } catch (error) {
            setQFormMessage(`Error adding question: ${error.message}`);
        } finally {
            setIsQLoading(false);
        }
    };

    // --- JSX (Form UI) ---
    return (
        <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <h4 className="text-lg font-semibold">Add New Question to This Exam</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Question Text */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Question Text / Image URL*</label>
                    <textarea rows="3" value={qText} onChange={(e) => setQText(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md" placeholder="Type question..."></textarea>
                </div>
                {/* Type, Difficulty, Tags */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type*</label>
                        <select value={qType} onChange={(e) => setQType(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                            <option value="MCQ">MCQ</option>
                            <option value="Descriptive">Q/A</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Difficulty</label> {/* Optional */}
                        <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tags (Optional, Comma Separated)</label>
                        <input type="text" value={qTags} onChange={(e) => setQTags(e.target.value)} placeholder="e.g., CO1" className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                </div>
                {/* MCQ Options */}
                {isMCQ && (
                    <div className="border-t pt-4">
                         <h5 className="font-medium mb-3">MCQ Options & Correct Answer</h5>
                         <div className="grid grid-cols-2 gap-4">
                             <input type="text" value={qOption1} onChange={(e) => setQOption1(e.target.value)} placeholder="1. Option A*" required className="p-2 border rounded-md" />
                             <input type="text" value={qOption2} onChange={(e) => setQOption2(e.target.value)} placeholder="2. Option B*" required className="p-2 border rounded-md" />
                             <input type="text" value={qOption3} onChange={(e) => setQOption3(e.target.value)} placeholder="3. Option C (Optional)" className="p-2 border rounded-md" />
                             <input type="text" value={qOption4} onChange={(e) => setQOption4(e.target.value)} placeholder="4. Option D (Optional)" className="p-2 border rounded-md" />
                         </div>
                         <div className="mt-4 flex items-center space-x-3">
                             <label className="text-sm font-medium text-gray-700">Correct Option Index:</label>
                              <select value={qCorrectOption} onChange={(e) => setQCorrectOption(e.target.value)} className="p-2 border rounded-md">
                                 <option value="1">1 (Option A)</option>
                                 <option value="2">2 (Option B)</option>
                                 <option value="3" disabled={!qOption3.trim()}>3 (Option C)</option>
                                 <option value="4" disabled={!qOption4.trim()}>4 (Option D)</option>
                             </select>
                              <p className="text-xs text-gray-500">Auto-grading is based on this.</p>
                         </div>
                    </div>
                )}
                <button type="submit" disabled={isQLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-semibold disabled:opacity-50">
                    {isQLoading ? 'Saving...' : `Add Question (${qType}) to Exam`}
                </button>
            </form>
             {qFormMessage && <p className={`mt-4 text-sm text-center ${qFormMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{qFormMessage}</p>}
        </div>
    );
};

// Add this component too (e.g., after QuestionAuthoringFormForExam)

const ExamQuestionManager = ({ examId, examTitle, onBack }) => {
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Fetch questions for this specific exam
    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setMessage('');
        try {
            const data = await apiService.getExamQuestions(examId);
            setQuestions(data);
             if (data.length === 0) {
                 setMessage("No questions added yet. Use the form below.");
             }
        } catch (error) {
            setMessage(`Error loading questions: ${error.message}`);
            console.error("Error fetching exam questions:", error);
        } finally {
            setIsLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    // Handler for deleting a question
    const handleDeleteQuestion = async (questionId, questionText) => {
        const shortText = questionText.substring(0, 50) + (questionText.length > 50 ? '...' : '');
        if (!window.confirm(`Delete question: "${shortText}"?`)) return;
        setMessage(''); // Clear message
        try {
            const result = await apiService.deleteExamQuestion(examId, questionId);
            // setMessage(result.message); // Can show success, but refreshing is clear enough
            fetchQuestions(); // Refresh list after deleting
        } catch (error) {
            setMessage(`Error deleting question: ${error.message}`);
        }
    };

    // Callback for when a new question is added via the form
    const handleQuestionAdded = () => {
        fetchQuestions(); // Just refresh the list
    };

    return (
        <div>
            {/* Back Button */}
            <button onClick={onBack} className="mb-4 text-sm text-blue-600 hover:underline">
                &larr; Back to Dashboard / Exam List
            </button>
            
            {/* Title */}
            <h2 className="text-2xl font-bold mb-1">Manage Questions for Exam:</h2>
            <h3 className="text-xl font-semibold text-indigo-700 mb-6">{examTitle} ({questions.length} Questions)</h3>

            {/* General Messages */}
            {message && <p className={`mb-4 text-sm text-center ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}

            {/* List of Existing Questions */}
            <div className="mb-8 border rounded-lg p-4 bg-gray-50">
                <h4 className="text-lg font-semibold mb-3">Existing Questions</h4>
                {isLoading && <p className="text-center text-gray-500">Loading questions...</p>}
                {!isLoading && questions.length === 0 && <p className="text-center text-gray-500">No questions added to this exam yet. Use the form below.</p>}
                {!isLoading && questions.length > 0 && (
                    <ul className="space-y-3 max-h-[40vh] overflow-auto pr-2"> {/* Added scroll */}
                        {questions.map((q, index) => (
                            <li key={q.id} className="p-3 border rounded bg-white flex justify-between items-start text-sm">
                                <div className="flex-grow mr-4">
                                    <p className="font-semibold mb-1">
                                        <span className="text-gray-500 mr-2">{index + 1}.</span> 
                                        ({q.type}{q.difficulty ? ` - ${q.difficulty}` : ''}) {/* Show type/difficulty */}
                                    </p>
                                    <p className="ml-5">{q.text}</p> {/* Indent text slightly */}
                                    {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                                        <div className="text-xs text-gray-600 ml-5 mt-1">
                                            <p>Options: {q.options.join(' | ')}</p>
                                            <p className="font-medium mt-1">Correct: "{q.correctOption}"</p>
                                        </div>
                                    )}
                                     {q.tags && q.tags.length > 0 && (
                                        <div className="text-xs text-gray-500 ml-5 mt-1">
                                            Tags: {q.tags.join(', ')}
                                        </div>
                                     )}
                                </div>
                                <div className="space-x-2 flex-shrink-0">
                                    <button className="text-xs text-blue-600 hover:underline disabled:text-gray-400" disabled>Edit</button> {/* Edit not implemented */}
                                    <button 
                                        onClick={() => handleDeleteQuestion(q.id, q.text)} 
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Question Authoring Form to Add New Questions */}
            {/* Pass examId and the callback */}
            <QuestionAuthoringFormForExam examId={examId} onQuestionAdded={handleQuestionAdded} />
        </div>
    );
};
// --- [2] NEW HELPER COMPONENT ---
// This is a new component to avoid repeating table code
const Table = ({ headers, data, renderRow }) => (
    <div className="overflow-auto max-h-96">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 sticky top-0">
                <tr>
                    {headers.map(h => <th key={h} className="p-2">{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? data.map(renderRow) : (
                    <tr><td colSpan={headers.length} className="p-4 text-center text-gray-500">No data found.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

// --- ADD THIS NEW COMPONENT ---
const ProctoringOverlay = ({ onAcknowledge }) => (
    <div 
        style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0, 0, 0, 0.9)', 
            zIndex: 9998, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
        }}
    >
        <div className="bg-white p-10 rounded-lg shadow-2xl max-w-lg text-center border-t-8 border-red-600">
            <h1 className="text-4xl font-bold text-red-600 mb-4">WARNING</h1>
            <p className="text-lg text-gray-800 mb-6">
                You have left the exam window or switched tabs. This action has been logged.
            </p>
            <p className="text-sm text-gray-600 mb-8">
                Continuing to do so may result in disqualification. Focus on the exam window.
            </p>
            <button
                onClick={onAcknowledge}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-10 rounded-lg text-lg"
            >
                I Understand, Return to Exam
            </button>
        </div>
    </div>
);

// --- [REPLACE] Your existing ExamTakingComponent with this ---
const ExamTakingComponent = ({ examInstanceId, totalQuestions, examTitle, onExamSubmit }) => {
    const [questions, setQuestions] = useState([]); // To hold the fetched questions
    const [answers, setAnswers] = useState({}); // To store the student's answers
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Proctoring State ---
    const [isProctoringViolation, setIsProctoringViolation] = useState(false);
    const violationCount = useRef(0); // This will count violations
    // ----------------------------

    // Fetch the exam questions when the component loads
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const data = await apiService.getExamInstanceQuestions(examInstanceId);
                setQuestions(data); // Save the array of QuestionVariants
                
                // Initialize the answers state object
                let initialAnswers = {};
                data.forEach(variant => {
                    initialAnswers[variant.id] = ''; // Key by QuestionVariant ID
                });
                setAnswers(initialAnswers);
                
            } catch (err) {
                setError(err.message || 'Failed to load exam questions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [examInstanceId]); // Run only when examInstanceId changes

    
    // --- NEW: Unified Violation Handler ---
    // This function will be called by the event listeners
    const handleViolation = (violationType) => {
        // Only trigger if the warning overlay isn't already showing
        if (isProctoringViolation) return;

        violationCount.current += 1; // Increment violation count
        
        // Log it to the backend (fire and forget)
        apiService.logViolation(examInstanceId, violationType);
        
        if (violationCount.current > 1) { 
            // This is the 2nd (or more) violation
            // Force auto-submit the exam
            handleSubmit(true); // Pass 'true' to signal an auto-submit
        } else {
            // This is the 1st violation, just show the warning
            setIsProctoringViolation(true);
        }
    };
    // ------------------------------------

    // --- Proctoring useEffect Hook (MODIFIED) ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log("Violation: Tab Switch");
                handleViolation('tab_switch'); // Call the new handler
            }
        };

        const handleBlur = () => {
            // Only trigger blur if the warning overlay isn't already active
            // This prevents a loop where the overlay causes a blur
            if (!isProctoringViolation) { 
                console.log("Violation: Focus Loss");
                handleViolation('focus_loss'); // Call the new handler
            }
        };
        
        // Add event listeners when component mounts
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        // Cleanup function: Remove listeners when component unmounts
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [examInstanceId, isProctoringViolation]); // Added isProctoringViolation as dependency
    // -------------------------------------

    // Update the answer state when a student types or selects an option
    const handleAnswerChange = (questionVariantId, answer) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionVariantId]: answer
        }));
    };

    // --- MODIFIED handleSubmit ---
    // Now accepts a flag to bypass the confirmation prompt
    const handleSubmit = (isAutoSubmit = false) => {
        // Convert answers object to the array format
        const formattedResponses = Object.keys(answers).map(variantId => ({
            questionVariantId: parseInt(variantId, 10),
            answer: answers[variantId]
        }));
        
        // If it's an auto-submit, don't ask for confirmation
        if (isAutoSubmit) {
            console.log("Auto-submitting due to violation...");
            onExamSubmit(examInstanceId, formattedResponses, true); // Pass 'true' to App
            return; 
        }

        // If it's a manual submit, ask for confirmation
        if (!window.confirm('Are you sure you want to submit your exam?')) {
            return;
        }

        onExamSubmit(examInstanceId, formattedResponses, false); // Pass 'false' for manual
    };
    // -----------------------------

    // --- Render Logic ---
    if (isLoading) {
        return <div className="p-8 text-center">Loading Exam...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <> {/* Use Fragment to render overlay on top */}
            {/* --- NEW: Conditional Overlay --- */}
            {isProctoringViolation && (
                <ProctoringOverlay 
                    onAcknowledge={() => setIsProctoringViolation(false)} 
                />
            )}
            {/* ----------------------------- */}
        
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg border-t-4 border-red-600">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-red-600">Exam In Progress</h2>
                        <h3 className="text-xl font-semibold text-gray-800">{examTitle}</h3>
                    </div>
                    <div className="text-right">
                        {/* Placeholder for Timer */}
                        <div className="text-lg font-bold">Time Left: 59:59</div> 
                        <div className="text-sm text-gray-600">{questions.length} Questions</div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.map((variant, index) => (
                        <div key={variant.id} className="p-4 border rounded-lg bg-gray-50">
                            <p className="font-semibold mb-3">
                                <span className="text-gray-600 mr-2">Q{index + 1}.</span> 
                                {variant.Question.text}
                            </p>
                            
                            {/* Render MCQ Options */}
                            {variant.Question.type === 'MCQ' && variant.Question.options && (
                                <div className="space-y-2 ml-6">
                                    {variant.Question.options.map((option, optIndex) => (
                                        <label key={optIndex} className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`q_${variant.id}`} // Group radios by question
                                                value={option} // The answer is the text of the option
                                                checked={answers[variant.id] === option}
                                                onChange={() => handleAnswerChange(variant.id, option)}
                                                className="form-radio text-indigo-600"
                                            />
                                            <span className="ml-3">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            
                            {/* Render Descriptive Answer Box */}
                            {variant.Question.type === 'Descriptive' && (
                                <div className="ml-6">
                                    <textarea
                                        rows="4"
                                        className="w-full p-2 border rounded-md"
                                        placeholder="Type your answer here..."
                                        value={answers[variant.id] || ''}
                                        onChange={(e) => handleAnswerChange(variant.id, e.target.value)}
                                    ></textarea>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Submit Button (This now calls the modified handleSubmit) */}
                <button 
                    onClick={() => handleSubmit(false)} // Call as manual submit
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold p-3 rounded-lg mt-8"
                >
                    Submit Final Answers
                </button>
            </div>
        </>
    );
};

// --- [3] REPLACED HODDashboard ---
// This is the new HOD Dashboard with tabs and all your new features.
// Your old Provisioning and Faculty Code forms are now in the "Admin Tools" tab.
const HODDashboard = () => {
    const [activeTab, setActiveTab] = useState('facultyRequests');
    
    // State for all data
    const [requests, setRequests] = useState([]);
    const [myFaculty, setMyFaculty] = useState([]);
    const [myStudents, setMyStudents] = useState([]);
    const [message, setMessage] = useState('');
    
    // States for faculty code form (from your old code)
    const [code, setCode] = useState('Loading...');
    const [newCode, setNewCode] = useState('');
    const [codeMessage, setCodeMessage] = useState('');
    const [codeLoading, setCodeLoading] = useState(false);

    // States for provisioning form (from your old code)
    const [provName, setProvName] = useState('');
    const [provEmail, setProvEmail] = useState('');
    const [provRole, setProvRole] = useState('faculty');
    const [provMessage, setProvMessage] = useState('');
    const [provLoading, setProvLoading] = useState(false);

    // Fetch all data on component load
    const fetchData = useCallback(async () => {
        setMessage('');
        try {
            const [reqData, facultyData, studentData, codeData] = await Promise.all([
                apiService.getFacultyRequests(),
                apiService.getMyFaculty(),
                apiService.getMyStudents_Inherited(),
                apiService.getFacultyCode()
            ]);
            setRequests(reqData);
            setMyFaculty(facultyData);
            setMyStudents(studentData);
            setCode(codeData.codeValue);
            setNewCode(codeData.codeValue);
        } catch (error) {
            setMessage(`Error loading dashboard data: ${error.message}`);
            // Handle code-specific error
            if (error.message.includes('Faculty Code')) {
                setCode('Not Yet Set');
            }
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers for Forms (from your old code) ---
    const handleSetCode = async (e) => {
        e.preventDefault();
        setCodeMessage(''); setCodeLoading(true);
        try {
            await apiService.setFacultyCode(newCode);
            setCode(newCode);
            setCodeMessage('Faculty Code updated successfully!');
        } catch (error) {
            setCodeMessage(`Error: ${error.message}`);
        } finally {
            setCodeLoading(false);
        }
    };

    const handleProvision = async (e) => {
        e.preventDefault();
        setProvMessage('Processing...'); setProvLoading(true);

        if (!isValidEmailDomain(provEmail)) {
            setProvMessage(`Error: Email must end with @${REQUIRED_DOMAIN}`);
            setProvLoading(false);
            return;
        }

        try {
            const result = await apiService.provisionStaff(provName, provEmail, 'PASS1234', provRole);
            setProvMessage(result.message);
            setProvName(''); setProvEmail('');
            // We don't need to refresh data here, as this is a manual override
        } catch (error) {
            setProvMessage(`Error: ${error.message}`);
        } finally {
            setProvLoading(false);
        }
    };
    
    // New handler for managing faculty requests
    const handleManageFaculty = async (affiliationId, newStatus) => {
        try {
            const result = await apiService.manageFacultyRequest(affiliationId, newStatus);
            alert(result.message);
            fetchData(); // Refresh all lists
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // Helper component for tabs
    const TabButton = ({ tabName, title }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-semibold rounded-t-lg ${activeTab === tabName ? 'bg-white border-b-0 border-t-4 border-r border-l border-indigo-600' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
            {title}
        </button>
    );

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-indigo-700">HOD Admin Portal</h2>
            {message && <p className="text-center text-red-500">{message}</p>}

            {/* Tab Navigation */}
            <div className="border-b border-gray-300 -mb-px">
                <TabButton tabName="facultyRequests" title={`Faculty Requests (${requests.length})`} />
                <TabButton tabName="myFaculty" title={`My Faculty (${myFaculty.length})`} />
                <TabButton tabName="myStudents" title={`My Students (${myStudents.length})`} />
                <TabButton tabName="tools" title="Admin Tools" />
            </div>
            
            <div className="bg-white p-6 rounded-b-xl rounded-r-xl shadow-lg">
                {/* --- Faculty Requests Tab --- */}
                {activeTab === 'facultyRequests' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Pending Faculty Requests</h3>
                        <Table
                            headers={['Name', 'Email', 'Actions']}
                            data={requests}
                            renderRow={(req) => (
                                <tr key={req.id} className="border-b">
                                    <td className="p-2">{req.Requestor.name}</td>
                                    <td className="p-2">{req.Requestor.email}</td>
                                    <td className="p-2 space-x-2">
                                        <button onClick={() => handleManageFaculty(req.id, 'approved')} className="text-green-600 hover:underline">Approve</button>
                                        <button onClick={() => handleManageFaculty(req.id, 'rejected')} className="text-red-600 hover:underline">Reject</button>
                                    </td>
                                </tr>
                            )}
                        />
                    </div>
                )}
                
                {/* --- My Faculty Tab --- */}
                {activeTab === 'myFaculty' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">My Approved Faculty</h3>
                        <Table
                            headers={['Name', 'Email']}
                            data={myFaculty}
                            renderRow={(faculty) => (
                                <tr key={faculty.id} className="border-b">
                                    <td className="p-2">{faculty.name}</td>
                                    <td className="p-2">{faculty.email}</td>
                                </tr>
                            )}
                        />
                    </div>
                )}
                
                {/* --- My Students (Inherited) Tab --- */}
                {activeTab === 'myStudents' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">All Students in My Department</h3>
                        <Table
                            headers={['Name', 'Email', 'Assigned Faculty']}
                            data={myStudents}
                            renderRow={(student) => (
                                <tr key={student.id} className="border-b">
                                    <td className="p-2">{student.name}</td>
                                    <td className="p-2">{student.email}</td>
                                    <td className="p-2 text-sm text-gray-600">{student.faculty}</td>
                                </tr>
                            )}
                        />
                    </div>
                )}
                
                {/* --- Admin Tools Tab (Your old components) --- */}
                {activeTab === 'tools' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* User Provisioning Form (Your old code) */}
                        <div className="bg-gray-50 p-6 rounded-xl space-y-4 border-l-4 border-purple-600">
                            <h3 className="text-xl font-semibold">User Provisioning (Manual)</h3>
                            <form onSubmit={handleProvision} className="space-y-3">
                                <input type="text" placeholder="Full Name" value={provName} onChange={(e) => setProvName(e.target.value)} required className="w-full p-2 border rounded-lg" />
                                <input type="email" placeholder="College Email" value={provEmail} onChange={(e) => setProvEmail(e.target.value)} required className="w-full p-2 border rounded-lg" />
                                <select value={provRole} onChange={(e) => setProvRole(e.target.value)} className="w-full p-2 border rounded-lg">
                                    <option value="faculty">Faculty</option>
                                    <option value="student">Student</option>
                                    <option value="admin">Admin (HOD)</option> 
                                </select>
                                <button type="submit" disabled={provLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg font-semibold">
                                    {provLoading ? 'Creating...' : 'Provision Account'}
                                </button>
                            </form>
                            {provMessage && <p className={`text-sm mt-2 text-center ${provMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{provMessage}</p>}
                        </div>
                        {/* Faculty Security Code Form (Your old code) */}
                        <div className="bg-gray-50 p-6 rounded-xl space-y-4 border-l-4 border-red-600">
                            <h3 className="text-xl font-semibold">Faculty Security Code</h3>
                            <p className="text-sm text-gray-600">Current Code: <span className="font-mono text-red-600 font-bold">{code}</span></p>
                            <form onSubmit={handleSetCode} className="space-y-3">
                                <input type="password" placeholder="Set New Code" value={newCode} onChange={(e) => setNewCode(e.target.value)} required className="w-full p-2 border rounded-lg" />
                                <button type="submit" disabled={codeLoading} className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-semibold">
                                    {codeLoading ? 'Updating...' : 'Update Code'}
                                </button>
                            </form>
                            {codeMessage && <p className={`text-sm mt-2 text-center ${codeMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{codeMessage}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Replace your existing FacultyDashboard component with this ---
const FacultyDashboard = () => {
    // State for which tab is active
    const [activeTab, setActiveTab] = useState('requests'); 

    // State for various data lists
    const [requests, setRequests] = useState([]);
    const [myStudents, setMyStudents] = useState([]);
    const [hodList, setHodList] = useState([]);
    const [myCreatedExams, setMyCreatedExams] = useState([]);
    const [submissions, setSubmissions] = useState([]); // Kept for Results tab
    const [message, setMessage] = useState(''); // General dashboard message

    // --- State for switching to Question Manager ---
    const [managingExamId, setManagingExamId] = useState(null); 
    const [managingExamTitle, setManagingExamTitle] = useState(''); 
    // ---------------------------------------------

    // State for Bulk Provision Tab
    const [bulkEmails, setBulkEmails] = useState('');
    const [bulkMessage, setBulkMessage] = useState('');
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    
    // State for Create Exam Form (Simplified)
    const [examTitle, setExamTitle] = useState('');
    const [examSubject, setExamSubject] = useState('');
    const [examDate, setExamDate] = useState(''); 
    const [examDuration, setExamDuration] = useState(60); 
    const [examTotalMarks, setExamTotalMarks] = useState(''); 
    // examBlueprint state REMOVED
    const [examMessage, setExamMessage] = useState(''); 
    const [isExamCreating, setIsExamCreating] = useState(false);
    
    // questionCount state REMOVED

    // --- Data Fetching (Removed question count fetch) ---
    const fetchData = useCallback(async () => {
        setMessage(''); 
        try {
            const [
                reqData, studentData, hodData, createdExamsData, submissionsData 
            ] = await Promise.all([
                apiService.getStudentRequests(),
                apiService.getMyStudents(),
                apiService.getHODList(),
                apiService.getMyCreatedExams(),
                apiService.getExamSubmissions() // Keep fetch for results tab
                // getQuestionCount call REMOVED
            ]);

            setRequests(reqData);
            setMyStudents(studentData);
            setHodList(hodData);
            setMyCreatedExams(createdExamsData);
            setSubmissions(submissionsData); // Keep setting results state
            // setQuestionCount REMOVED

        } catch (error) {
            setMessage(`Error loading dashboard data: ${error.message}`);
            console.error("Dashboard fetch error:", error);
        }
    }, []); // Removed dependency array unless needed

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers ---

    // Handler to send affiliation request to HOD
    const handleRequestHOD = async (hodId, name) => {
        console.log('Attempting to request HOD:', hodId, name); // Logging added
        if (!window.confirm(`Send affiliation request to HOD ${name}?`)) return;
        try {
            const result = await apiService.requestHOD(hodId);
            console.log('HOD Request Result:', result); // Logging added
            alert(result.message); // Show success/error from backend
            // Optionally disable button or refresh UI state here
        } catch (error) {
            console.error('HOD Request Error:', error); // Logging added
            alert(`Error sending request: ${error.message}`);
        }
    };
    
    // Handler to approve/reject student requests
    const handleManageStudent = async (affiliationId, newStatus) => {
        console.log(`Attempting to ${newStatus} student request:`, affiliationId); // Logging added
        try {
            const result = await apiService.manageStudentRequest(affiliationId, newStatus);
            console.log('Manage Student Request Result:', result); // Logging added
            alert(result.message);
            fetchData(); // Refresh all lists (requests and myStudents)
        } catch (error) {
            console.error('Manage Student Request Error:', error); // Logging added
            alert(`Error updating request: ${error.message}`);
        }
    };

    // Handler for Bulk Provisioning students
    const handleBulkProvision = async (e) => {
        e.preventDefault();
        console.log('Attempting bulk provision...'); // Logging added
        setBulkMessage('Processing...');
        setIsBulkLoading(true);
    
        const allEmails = bulkEmails.split('\n')
                                   .map(email => email.trim())
                                   .filter(email => email.length > 0);

        // Filter for valid domain
        const validEmails = allEmails.filter(isValidEmailDomain);
        const invalidEmails = allEmails.filter(email => !isValidEmailDomain(email));

        let messageUpdate = '';
        if (invalidEmails.length > 0) {
            messageUpdate += `Skipped ${invalidEmails.length} invalid emails (must end with @${REQUIRED_DOMAIN}). `;
        }
        
        if (validEmails.length === 0) {
            setBulkMessage(messageUpdate + 'No valid emails found to provision.');
            setIsBulkLoading(false);
            return;
        }
    
        try {
            const result = await apiService.bulkProvisionStudents(validEmails); 
            console.log('Bulk Provision Result:', result); // Logging added
            setBulkMessage(messageUpdate + result.message + ` (Success: ${result.details?.success?.length || 0}, Failed: ${result.details?.failed?.length || 0})`);
            // setBulkEmails(''); // Optionally clear textarea after success
        } catch (error) {
            console.error('Bulk Provision Error:', error); // Logging added
            setBulkMessage(messageUpdate + ` Error: ${error.message}`);
        } finally {
            setIsBulkLoading(false);
        }
    };

    // Handler for deleting an exam
    const handleDeleteExam = async (examId, title) => {
        console.log('Attempting to delete exam:', examId, title); // Logging added
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete the exam: "${title}"? This also deletes all associated questions.`)) return; // Updated warning

        try {
            const result = await apiService.deleteExam(examId);
            console.log('Delete Exam Result:', result); // Logging added
            alert(result.message);
            fetchData(); // Refresh the exam list
        } catch (error) {
            console.error('Delete Exam Error:', error); // Logging added
            alert(`Error deleting exam: ${error.message}`);
        }
    };

    // Handler for Create Exam (MODIFIED: No blueprint)
    const handleCreateExam = async (e) => {
        e.preventDefault();
        setExamMessage('Creating exam shell...'); // Updated message
        setIsExamCreating(true);

        // Blueprint parsing REMOVED

        const examData = {
            title: examTitle,
            subject: examSubject,
            date: examDate,
            duration: parseInt(examDuration, 10),
            totalMarks: parseInt(examTotalMarks, 10),
            // policy: {} // Add policy later if needed
        };

        // Input validation
        if (isNaN(examData.duration) || examData.duration <= 0) {
             setExamMessage(`Error: Duration must be a positive number.`);
             setIsExamCreating(false); return;
        }
        if (isNaN(examData.totalMarks) || examData.totalMarks <= 0) {
             setExamMessage(`Error: Total Marks must be a positive number.`);
             setIsExamCreating(false); return;
        }

        try {
            const result = await apiService.createExam(examData);
            setExamMessage(`Success: ${result.message}`); // Use backend message
            // Clear form
            setExamTitle('');
            setExamSubject('');
            setExamDate('');
            setExamDuration(60);
            setExamTotalMarks('');
            // Blueprint removed
            fetchData(); // Refresh data to update "My Created Exams" tab
        } catch (error) {
            setExamMessage(`Error creating exam: ${error.message}`);
        } finally {
            setIsExamCreating(false);
        }
    };


    // --- Helper Component ---
    const TabButton = ({ tabName, title }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-semibold rounded-t-lg ${activeTab === tabName ? 'bg-white border-b-0 border-t-4 border-r border-l border-green-600' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
            {title}
        </button>
    );

    // --- Render JSX (With Conditional View for Question Manager) ---
    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            
            {/* --- Conditionally render Exam Manager OR Dashboard --- */}
            {managingExamId ? ( 
                // If managingExamId is set, show the Question Manager component
                <ExamQuestionManager 
                    examId={managingExamId} 
                    examTitle={managingExamTitle}
                    onBack={() => setManagingExamId(null)} // Function to return to dashboard
                />
            ) : (
                // --- Otherwise, render the main Tabbed Dashboard ---
                <> {/* Use React Fragment to group elements */}
                    <h2 className="text-3xl font-bold text-green-700">Faculty Examiner Dashboard</h2>
                    {message && <p className="text-center text-red-500">{message}</p>}
                    
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-300 -mb-px">
                        <TabButton tabName="requests" title={`Student Requests (${requests.length})`} />
                        <TabButton tabName="students" title={`My Students (${myStudents.length})`} />
                        <TabButton tabName="hod" title="Find My HOD" />
                        <TabButton tabName="exams" title="Create Exam" /> {/* Simplified Title */}
                        <TabButton tabName="bulkProvision" title="Bulk Provision Students" />
                        <TabButton tabName="myExams" title={`My Created Exams (${myCreatedExams.length})`} />
                        <TabButton tabName="results" title={`Student Results (${submissions.length})`} />
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white p-6 rounded-b-xl rounded-r-xl shadow-lg min-h-[400px]"> 

                       {/* --- Student Requests Tab --- */}
                       {activeTab === 'requests' && (
                           <div>
                               <h3 className="text-xl font-semibold mb-4">Pending Student Requests</h3>
                               <Table
                                   headers={['Name', 'Email', 'Actions']}
                                   data={requests}
                                   renderRow={(req) => (
                                       <tr key={req.id} className="border-b">
                                           <td className="p-2">{req.Requestor.name}</td>
                                           <td className="p-2">{req.Requestor.email}</td>
                                           <td className="p-2 space-x-2">
                                               <button onClick={() => handleManageStudent(req.id, 'approved')} className="text-green-600 hover:underline">Approve</button>
                                               <button onClick={() => handleManageStudent(req.id, 'rejected')} className="text-red-600 hover:underline">Reject</button>
                                           </td>
                                       </tr>
                                   )}
                               />
                               {requests.length === 0 && <p className="text-center text-gray-500 mt-4">No pending student requests.</p>}
                           </div>
                       )}

                       {/* --- My Students Tab --- */}
                       {activeTab === 'students' && (
                           <div>
                               <h3 className="text-xl font-semibold mb-4">My Approved Students</h3>
                               <Table
                                   headers={['Name', 'Email']}
                                   data={myStudents}
                                   renderRow={(student) => (
                                       <tr key={student.id} className="border-b">
                                           <td className="p-2">{student.name}</td>
                                           <td className="p-2">{student.email}</td>
                                       </tr>
                                   )}
                               />
                                {myStudents.length === 0 && <p className="text-center text-gray-500 mt-4">No students have been approved yet.</p>}
                           </div>
                       )}

                       {/* --- Find HOD Tab --- */}
                       {activeTab === 'hod' && (
                            <div>
                               <h3 className="text-xl font-semibold mb-4">Find My HOD</h3>
                               <p className="text-sm text-gray-600 mb-4">Send a request to your HOD to be affiliated with their department.</p>
                               <Table
                                   headers={['Name', 'Email', 'Actions']}
                                   data={hodList}
                                   renderRow={(hod) => (
                                       <tr key={hod.id} className="border-b">
                                           <td className="p-2">{hod.name}</td>
                                           <td className="p-2">{hod.email}</td>
                                           <td className="p-2">
                                               {/* TODO: Add logic to disable if request already sent/approved */}
                                               <button onClick={() => handleRequestHOD(hod.id, hod.name)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs">Send Request</button>
                                           </td>
                                       </tr>
                                   )}
                               />
                                {hodList.length === 0 && <p className="text-center text-gray-500 mt-4">No HOD accounts found.</p>}
                           </div>
                       )}
                       
                       {/* --- SIMPLIFIED Exam Management Tab (Create Exam ONLY) --- */}
                       {activeTab === 'exams' && (
                            <div className="space-y-8">
                                {/* Exam Creation Section ONLY */}
                                <div className="pt-4">
                                    <h3 className="text-xl font-semibold mb-4">Create New Exam Shell</h3>
                                    <p className="text-sm text-gray-600 mb-4">Create the exam details here. Add questions after creation via the "My Created Exams" tab.</p>
                                    <form onSubmit={handleCreateExam} className="space-y-4 max-w-2xl">
                                        {/* Exam Title Input */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Exam Title*</label>
                                            <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md" />
                                        </div>
                                        {/* Subject Input */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                                            <input type="text" value={examSubject} onChange={(e) => setExamSubject(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" />
                                        </div>
                                        {/* Date Input */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date and Time*</label>
                                            <input type="datetime-local" value={examDate} onChange={(e) => setExamDate(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md" />
                                        </div>
                                        {/* Duration & Total Marks Inputs */}
                                        <div className="grid grid-cols-2 gap-4">
                                           <div>
                                               <label className="block text-sm font-medium text-gray-700">Duration (minutes)*</label>
                                               <input type="number" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} required min="1" className="mt-1 block w-full p-2 border rounded-md" />
                                           </div>
                                           <div>
                                               <label className="block text-sm font-medium text-gray-700">Total Marks*</label>
                                               <input type="number" value={examTotalMarks} onChange={(e) => setExamTotalMarks(e.target.value)} required min="1" className="mt-1 block w-full p-2 border rounded-md" />
                                           </div>
                                        </div>
                                        {/* Blueprint REMOVED */}
                                        <button type="submit" disabled={isExamCreating} className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-semibold disabled:opacity-50">
                                            {isExamCreating ? 'Creating...' : 'Create Exam Shell'}
                                        </button>
                                    </form>
                                    {examMessage && <p className={`mt-4 text-sm text-center ${examMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{examMessage}</p>}
                                </div>
                                {/* Question Authoring Form REMOVED from this tab */}
                            </div>
                        )}
                        {/* ----------------------------------------------- */}

                       {/* --- Bulk Provision Tab --- */}
                       {activeTab === 'bulkProvision' && (
                           <div>
                               <h3 className="text-xl font-semibold mb-4">Bulk Provision Students</h3>
                               <p className="text-sm text-gray-600 mb-4">Paste student emails (one per line). Accounts use default password ('PASS1234') and require reset.</p>
                               <form onSubmit={handleBulkProvision}>
                                   <textarea rows="10" className="w-full p-2 border rounded-lg mb-4 font-mono text-sm" placeholder={`student1@${REQUIRED_DOMAIN}\nstudent2@${REQUIRED_DOMAIN}`} value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} />
                                   <button type="submit" disabled={isBulkLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg font-semibold disabled:opacity-50">
                                       {isBulkLoading ? 'Processing...' : `Provision ${bulkEmails.split('\n').filter(e => e.trim()).length} Students`}
                                   </button>
                               </form>
                               {bulkMessage && <p className={`mt-4 text-sm text-center ${bulkMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{bulkMessage}</p>}
                           </div>
                       )}

                       {/* --- MODIFIED My Created Exams Tab --- */}
                       {activeTab === 'myExams' && (
                           <div>
                               <h3 className="text-xl font-semibold mb-4">My Created Exams</h3>
                               <Table
                                   headers={['Title', 'Subject', 'Date', 'Duration', 'Actions']}
                                   data={myCreatedExams}
                                   renderRow={(exam) => (
                                       <tr key={exam.id} className="border-b hover:bg-gray-50">
                                           <td className="p-2">{exam.title}</td>
                                           <td className="p-2">{exam.subject || 'N/A'}</td>
                                           <td className="p-2">{new Date(exam.date).toLocaleDateString()}</td>
                                           <td className="p-2">{exam.duration} mins</td>
                                           <td className="p-2 space-x-3"> {/* Increased spacing */}
                                               {/* Manage Questions Button - ADDED */}
                                               <button 
                                                   onClick={() => { 
                                                       setManagingExamId(exam.id); 
                                                       setManagingExamTitle(exam.title); 
                                                   }} 
                                                   className="text-purple-600 hover:underline font-medium" 
                                               >
                                                   Manage Questions
                                               </button>
                                               {/* Edit Exam Details Button */}
                                               <button className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline" disabled>Edit Details</button> 
                                               {/* Delete Exam Button */}
                                               <button onClick={() => handleDeleteExam(exam.id, exam.title)} className="text-red-600 hover:underline">Delete Exam</button>
                                           </td>
                                       </tr>
                                   )}
                               />
                               {myCreatedExams.length === 0 && <p className="text-center text-gray-500 mt-4">No exams created yet. Use the 'Create Exam' tab.</p>}
                           </div>
                       )}
                       {/* ------------------------------------- */}

                       {/* --- Student Results Tab --- */}
                       {activeTab === 'results' && (
                            <div>
                               <h2 className="text-2xl font-bold mb-4">Student Exam Submissions & Results ({submissions.length} Total)</h2>
                               <Table
                                   headers={['Exam Title', 'Student Name', 'Student Email', 'Status', 'Score', 'Submitted On']}
                                   data={submissions}
                                   renderRow={(submission) => (
                                       <tr key={submission.id} className="border-b hover:bg-gray-50">
                                           <td className="p-2 font-medium">{submission.exam.title}</td>
                                           <td className="p-2">{submission.student.name}</td>
                                           <td className="p-2">{submission.student.email}</td>
                                           <td className="p-2 font-semibold">
                                               {submission.examInstance?.status === 'Submitted' ? 'Submitted' : (submission.examInstance?.status || 'Unknown')} {/* Added null check */}
                                           </td>
                                           <td className="p-2 font-semibold">
                                               {/* Added null check for exam */}
                                               {submission.score === null ? 'N/A' : `${submission.score} / ${submission.exam?.totalMarks || '?'}`} 
                                           </td>
                                           <td className="p-2">
                                               {/* Added null check for createdAt */}
                                               {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : 'N/A'} 
                                           </td>
                                       </tr>
                                   )}
                               />
                               {submissions.length === 0 && <p className="text-center text-gray-500 mt-4">No exams have been submitted yet.</p>}
                           </div>
                       )}
                       {/* ----------------------------- */}

                    </div> {/* End Tab Content Div */}
                </>
            )} {/* End Conditional Rendering Div */}
        </div> // End Main Component Div
    );
}; // End FacultyDashboard Component

// --- Replace your existing StudentDashboard with this ---
const StudentDashboard = ({ onStartExam }) => {
    // State for Find Faculty section
    const [allFacultyList, setAllFacultyList] = useState([]); // List for sending requests
    const [facultyMessage, setFacultyMessage] = useState('');
    const [isFacultyLoading, setIsFacultyLoading] = useState(true);
    
    // --- State for Approved Faculty & Their Exams ---
    const [approvedFaculty, setApprovedFaculty] = useState([]); // List of approved faculty
    const [selectedFacultyId, setSelectedFacultyId] = useState(null); // Which faculty room is open?
    const [selectedFacultyExams, setSelectedFacultyExams] = useState([]); // Exams for the selected faculty
    const [isExamLoading, setIsExamLoading] = useState(false); // Loading exams for selected faculty
    const [examMessage, setExamMessage] = useState(''); // Messages within the faculty room

    // --- Fetch initial data: All faculty + Approved faculty ---
    const loadInitialData = useCallback(async () => {
        setIsFacultyLoading(true);
        setFacultyMessage('');
        try {
            const [allFacultyData, approvedData] = await Promise.all([
                apiService.getFacultyList(),      // For "Find Faculty"
                apiService.getMyApprovedFaculty() // For the "My Faculty/Subjects" section
            ]);
            setAllFacultyList(allFacultyData);
            setApprovedFaculty(approvedData);
            if (approvedData.length === 0) {
                 setExamMessage("You are not yet approved by any faculty. Use the 'Find My Faculty' section below to send requests.");
            }
        } catch (error) {
            const errMsg = `Error loading initial data: ${error.message}`;
            console.error(errMsg);
            setFacultyMessage("Could not load faculty list.");
            setExamMessage("Could not load your approved faculty.");
        } finally {
            setIsFacultyLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // --- Function to load exams when a faculty is selected ---
    const loadExamsForFaculty = useCallback(async (facultyId) => {
        if (!facultyId) {
            setSelectedFacultyExams([]);
            setExamMessage('');
            return;
        }
        setSelectedFacultyId(facultyId);
        setIsExamLoading(true);
        setExamMessage(''); // Clear previous messages
        try {
            const exams = await apiService.getExamsByFaculty(facultyId);
            setSelectedFacultyExams(exams);
             if (exams.length === 0) {
                 setExamMessage("No upcoming exams found for this faculty.");
            }
        } catch (error) {
            console.error(`Error loading exams for faculty ${facultyId}:`, error);
            setExamMessage(`Error loading exams: ${error.message}`);
        } finally {
            setIsExamLoading(false);
        }
    }, []);

    // --- Handler for Faculty Request (Unchanged) ---
    const handleRequest = async (facultyId, name) => {
        // ... (keep your existing handleRequest function code) ...
         if (!window.confirm(`Send enrollment request to ${name}?`)) return;
        setFacultyMessage(''); 
        try {
            const result = await apiService.requestFaculty(facultyId);
            setFacultyMessage(result.message); 
            alert(result.message); 
            // loadInitialData(); // Optional: Refresh data 
        } catch (error) {
            const errMsg = `Error: ${error.message}`;
            setFacultyMessage(errMsg); 
            alert(errMsg);
        }
    };
    
    // --- Handler for Starting Exam (Unchanged) ---
    const handleStartExam = async (examId, examTitle) => {
        // ... (keep your existing handleStartExam function code) ...
        if (!window.confirm(`Are you sure you want to start the exam: "${examTitle}"? The timer will begin immediately.`)) return;
        setExamMessage(''); 
        try {
            const result = await apiService.startExam(examId);
            onStartExam({
               instanceId: result.examInstanceId,
               totalQuestions: result.totalQuestions,
               title: examTitle
            }); 
            // TODO: Implement navigation 
        } catch(error) {
             const errMsg = `Error starting exam: ${error.message}`;
             setExamMessage(errMsg); 
             alert(errMsg);
        }
    };

    // --- Get the name of the currently selected faculty ---
    const selectedFacultyName = approvedFaculty.find(f => f.id === selectedFacultyId)?.name;

    // --- The Component's Appearance (JSX) ---
    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto"> 
            <h2 className="text-3xl font-bold text-blue-700">Student Dashboard</h2>

            {/* --- Section 1: My Faculty / Subject Rooms --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600">
                <h3 className="text-2xl font-bold text-purple-700 mb-4">My Subjects / Faculty</h3>
                 {/* Show message if not approved by anyone */}
                {approvedFaculty.length === 0 && !isFacultyLoading && (
                    <p className="text-center text-gray-500">{examMessage}</p>
                )}
                 {/* Show buttons for each approved faculty */}
                {approvedFaculty.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                        {approvedFaculty.map(faculty => (
                            <button
                                key={faculty.id}
                                onClick={() => loadExamsForFaculty(faculty.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                                    selectedFacultyId === faculty.id 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {faculty.name}
                            </button>
                        ))}
                         {/* Button to clear selection */}
                         {selectedFacultyId && (
                             <button onClick={() => setSelectedFacultyId(null)} className="text-sm text-gray-500 hover:underline ml-auto">Show All</button>
                         )}
                    </div>
                )}

                {/* --- Exam List Area (shows exams for selected faculty) --- */}
                {selectedFacultyId && (
                     <div className="mt-4 border-t pt-4">
                        <h4 className="text-xl font-semibold text-gray-800 mb-3">Upcoming Exams by {selectedFacultyName}</h4>
                        {/* Show loading/error messages for exams */}
                        {isExamLoading && <p className="text-center text-gray-500">Loading exams...</p>}
                        {examMessage && !isExamLoading && <p className="text-center text-sm text-gray-600 mb-4">{examMessage}</p>}
                        
                        {/* Only show table if exams are loaded and there are exams */}
                        {!isExamLoading && selectedFacultyExams.length > 0 && (
                            <Table
                                headers={['Exam Title', 'Subject', 'Date', 'Duration', 'Action']}
                                data={selectedFacultyExams}
                                renderRow={(exam) => (
                                    <tr key={exam.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{exam.title}</td>
                                        <td className="p-2">{exam.subject || 'N/A'}</td>
                                        <td className="p-2">{new Date(exam.date).toLocaleString()}</td>
                                        <td className="p-2">{exam.duration} mins</td>
                                        <td className="p-2">
                                            <button 
                                                onClick={() => handleStartExam(exam.id, exam.title)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs transition duration-150 shadow-md disabled:opacity-50"
                                            >
                                                Start Exam
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            />
                        )}
                        {/* Show message if loaded but no exams for this faculty */}
                        {!isExamLoading && selectedFacultyExams.length === 0 && !examMessage && (
                           <p className="text-center text-gray-500">No upcoming exams found for this faculty.</p>
                        )}
                        {/* TODO: Add sections for Past Exams and Results for this faculty */}
                     </div>
                )}
            </div>

            {/* --- Section 2: Find My Faculty (Unchanged) --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-600">
                {/* ... (Keep the exact JSX code for this section from the previous version) ... */}
                 <h2 className="text-2xl font-bold text-gray-700 mb-4">Find My Faculty</h2>
                <p className="text-sm text-gray-600 mb-4">Send an enrollment request to a faculty member. Once approved, they will appear in the 'My Subjects / Faculty' section above.</p>
                {isFacultyLoading && <p className="text-center text-gray-500">Loading faculty list...</p>}
                {facultyMessage && !isFacultyLoading && <p className="text-center text-sm text-red-500 mb-2">{facultyMessage}</p>}
                
                {!isFacultyLoading && (
                    <Table
                        headers={['Name', 'Email', 'Actions']}
                        data={allFacultyList}
                        renderRow={(faculty) => ( 
                            <tr key={faculty.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{faculty.name}</td>
                                <td className="p-2">{faculty.email}</td>
                                <td className="p-2">
                                    <button 
                                        onClick={() => handleRequest(faculty.id, faculty.name)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs transition duration-150 shadow-md"
                                        // TODO: Disable button if request is pending/approved
                                    >
                                        Send Request
                                    </button>
                                </td>
                            </tr>
                        )}
                    />
                )}
            </div>
        </div>
    );
};


// --- MAIN APPLICATION COMPONENT (UNCHANGED) ---
const App = () => {
    const [user, setUser] = useState(null);
    const [resetState, setResetState] = useState(null); // { email, token } for reset

    const [activeExam, setActiveExam] = useState(null);
    // Check for existing token on initial load
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                // Resume session if token is valid
                setUser({ id: payload.id, role: payload.role, email: payload.email }); 
            } catch (e) {
                localStorage.removeItem('token'); // Clear invalid token
            }
        }
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setResetState(null);
    }, []);

    const handleAuthSuccess = useCallback((userInfo) => {
        setUser(userInfo);
        setResetState(null);
    }, []);
    
    const handlePasswordResetSuccess = useCallback((successMessage) => {
        setResetState(null);
        alert(successMessage); // Notify user to re-login
    }, []);

    const renderContent = () => {
        // Priority 1: Handle compulsory password reset (Unchanged)
        if (resetState) {
            return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                    <PasswordResetForm 
                        email={resetState.email} 
                        token={resetState.token} 
                        handleSuccess={handlePasswordResetSuccess} 
                    />
                </div>
            );
        }

// --- MODIFIED: Priority 2: Check if an exam is in progress ---
    if (activeExam) {
        return (
            <ExamTakingComponent 
                examInstanceId={activeExam.instanceId}
                totalQuestions={activeExam.totalQuestions}
                examTitle={activeExam.title}
                // --- MODIFIED onExamSubmit prop ---
                onExamSubmit={ async (instanceId, responses, isAutoSubmit) => { 
                    try {
                        const result = await apiService.submitExam(instanceId, responses);
                        
                        // Show different alert based on how it was submitted
                        if (isAutoSubmit) {
                            alert(`VIOLATION LIMIT EXCEEDED.\nYour exam has been automatically submitted.\n\nStatus: ${result.status}\nMCQ Score: ${result.objectiveScore}`);
                        } else {
                            alert(`Exam Submitted!\nStatus: ${result.status}\nMCQ Score: ${result.objectiveScore}`);
                        }
                        setActiveExam(null); // Go back to the dashboard
                    } catch (err) {
                        alert(`Error submitting exam: ${err.message}`);
                    }
                }}
            />
        );
    }
    // --- END MODIFIED ---
        // --- END NEW ---

// Priority 3: Show login form if no user (Unchanged)
        if (!user) {
            return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                    <AuthForm 
                        onAuthSuccess={handleAuthSuccess} 
                        onPasswordResetRequired={setResetState}
                    />
                </div>
            );
        }

        // Priority 4: Show the correct dashboard (Modified for student)
        switch (user.role) {
            case 'admin':
                return <HODDashboard />;
            case 'faculty':
                return <FacultyDashboard />;
            case 'student':
                // --- MODIFIED: Pass the onStartExam function down ---
                return <StudentDashboard onStartExam={setActiveExam} />; 
            default:
                return <div className="p-8 text-center text-red-500 font-semibold">Access Denied: Invalid User Role. Please contact support.</div>;
        }
    };

    return (
        <div className="min-h-screen font-sans bg-gray-100">
            <Header user={user} onLogout={handleLogout} />
            <main className="py-10 px-4">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;