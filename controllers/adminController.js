import { SecurityConfig } from '../models/SecurityConfig.js';
import { User } from '../models/User.js';
import bcryptjs from 'bcryptjs';
import { Affiliation } from '../models/Affiliation.js';
import { Op } from 'sequelize';

// --- This function is correct ---
const setFacultyCode = async (req, res) => {
    try {
        const { codeValue } = req.body;
        const updatedBy = req.user.id; 

        if (!codeValue || codeValue.length < 4) {
            return res.status(400).json({ message: 'Code must be at least 4 characters.' });
        }

        const [config, created] = await SecurityConfig.upsert({
            keyName: 'FACULTY_CODE',
            codeValue: codeValue,
            updatedBy: updatedBy
        });

        res.status(200).json({ message: `Faculty Code successfully ${created ? 'set' : 'updated'}.` });

    } catch (error) {
        console.error('Error setting faculty code:', error);
        res.status(500).json({ error: 'Failed to update security configuration.' });
    }
};

// --- This function is correct ---
const getFacultyCode = async (req, res) => {
    try {
        const config = await SecurityConfig.findOne({ where: { keyName: 'FACULTY_CODE' } });
        
        if (!config) {
            return res.status(404).json({ message: 'Faculty Code not yet configured.' });
        }
        
        res.status(200).json({ codeValue: config.codeValue });

    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve security configuration.' });
    }
};

// --- This function is correct ---
const provisionStaff = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!['admin', 'faculty', 'student'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }
    const defaultPassword = password || 'PASS1Example';

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role,
            mustChangePassword: role === 'student' || role === 'faculty' 
        });
        res.status(201).json({ 
            message: `${role} account provisioned successfully.`, 
            user: { id: newUser.id, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        console.error('Error provisioning user:', error);
        res.status(500).json({ error: 'Failed to provision user account.' });
    }
};

// --- *** THIS IS THE NEW FUNCTION YOU WERE MISSING *** ---
const getAllUsersByRole = async (req, res) => {
    const { role } = req.query; // e.g., ?role=student

    if (!role) {
        return res.status(400).json({ message: 'Role query parameter is required.' });
    }

    try {
        const users = await User.findAll({
            where: { role: role },
            // We only send back non-sensitive data
            attributes: ['id', 'name', 'email', 'role', 'createdAt']
        });
        res.status(200).json(users);
    } catch (error) {
        console.error(`Error fetching users by role: ${error.message}`);
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
};

// NEW FUNCTION: HOD gets all pending faculty requests
const getFacultyRequests = async (req, res) => {
    try {
        const hodId = req.user.id;
        const requests = await Affiliation.findAll({
            where: {
                ApproverId: hodId,
                type: 'faculty_to_hod',
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'Requestor',
                attributes: ['id', 'name', 'email']
            }]
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching faculty requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests.' });
    }
};

// NEW FUNCTION: HOD approves or rejects a faculty's request
const manageFacultyRequest = async (req, res) => {
    try {
        const hodId = req.user.id;
        const { affiliationId } = req.params;
        const { newStatus } = req.body;

        if (!['approved', 'rejected'].includes(newStatus)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const request = await Affiliation.findOne({
            where: {
                id: affiliationId,
                ApproverId: hodId,
                type: 'faculty_to_hod'
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found or you do not have permission.' });
        }

        request.status = newStatus;
        await request.save();
        res.status(200).json({ message: `Faculty request ${newStatus}.` });
    } catch (error) {
        console.error('Error managing faculty request:', error);
        res.status(500).json({ error: 'Failed to update request.' });
    }
};

// NEW FUNCTION: HOD gets a list of all their *approved* faculty
const getMyFaculty = async (req, res) => {
    try {
        const hodId = req.user.id;
        const approvedAffiliations = await Affiliation.findAll({
            where: {
                ApproverId: hodId,
                type: 'faculty_to_hod',
                status: 'approved'
            },
            include: [{ model: User, as: 'Requestor', attributes: ['id', 'name', 'email'] }]
        });
        const faculty = approvedAffiliations.map(aff => aff.Requestor);
        res.status(200).json(faculty);
    } catch (error) {
        console.error('Error fetching "my faculty":', error);
        res.status(500).json({ error: 'Failed to fetch faculty.' });
    }
};

// NEW FUNCTION: HOD gets all students approved by their approved faculty
const getMyStudents_Inherited = async (req, res) => {
    try {
        const hodId = req.user.id;

        // 1. Find all faculty approved by this HOD
        const approvedFaculty = await Affiliation.findAll({
            where: {
                ApproverId: hodId,
                type: 'faculty_to_hod',
                status: 'approved'
            },
            attributes: ['RequestorId'] // We only need the faculty IDs
        });

        const facultyIds = approvedFaculty.map(aff => aff.RequestorId);
        if (facultyIds.length === 0) {
            return res.status(200).json([]); // No faculty, so no students
        }

        // 2. Find all students approved by *those* faculty
        const approvedStudentsAffiliations = await Affiliation.findAll({
            where: {
                ApproverId: { [Op.in]: facultyIds }, // Approver is one of the HOD's faculty
                type: 'student_to_faculty',
                status: 'approved'
            },
            include: [
                { model: User, as: 'Requestor', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'Approver', attributes: ['id', 'name'] } // Include faculty info
            ]
        });
        
        // Re-format to a clean list of students, adding their faculty's name
        const students = approvedStudentsAffiliations.map(aff => ({
            id: aff.Requestor.id,
            name: aff.Requestor.name,
            email: aff.Requestor.email,
            faculty: aff.Approver.name // Show which faculty they belong to
        }));

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching inherited students:', error);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
};

// --- *** THIS IS THE CORRECTED EXPORT LINE *** ---
export { 
    setFacultyCode, 
    getFacultyCode, 
    provisionStaff, 
    getAllUsersByRole,
    getFacultyRequests,      // <-- ADD
    manageFacultyRequest,    // <-- ADD
    getMyFaculty,            // <-- ADD
    getMyStudents_Inherited  // <-- ADD
};