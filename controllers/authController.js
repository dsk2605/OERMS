import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { SecurityConfig } from '../models/SecurityConfig.js'; 
import { HODsList } from '../models/HODsList.js';
import { DomainRegistry } from '../models/DomainRegistry.js'; 

const getDomain = (email) => email.split('@').pop();

// --- FUNCTION 1: registerUser ---
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const domain = getDomain(email);

        const registryEntry = await DomainRegistry.findOne({ where: { domain: domain, status: 'Active' } });
        if (!registryEntry) {
            return res.status(403).json({ message: 'Registration Forbidden: Your college domain is not approved for self-registration.' });
        }
        
        const hodEntry = await HODsList.findOne({ where: { email: email, collegeId: registryEntry.collegeId } });
        
        const roleToAssign = hodEntry ? hodEntry.roleToAssign : 'student'; 

        let user = await User.findOne({ where: { email: email } });
        if (user) {
            return res.status(409).json({ message: 'User already exists.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const mustChangePassword = roleToAssign === 'student'; 

        user = await User.create({ 
            name, 
            email, 
            password: hashed, 
            role: roleToAssign,
            collegeId: registryEntry.collegeId,
            mustChangePassword: mustChangePassword 
        });

        res.status(201).json({ message: `Registration successful. Role: ${roleToAssign.toUpperCase()}.` });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal registration error.' });
    }
};

// --- FUNCTION 2: loginUser (This is the fixed version) ---
const loginUser = async (req, res) => {
    try {
        const { email, password, facultyCode } = req.body; 
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid credentials or code.' });

        if (user.role === 'faculty') {
            if (!facultyCode) {
                return res.status(401).json({ message: 'Faculty login requires the unique Faculty Code.' });
            }
            const config = await SecurityConfig.findOne({ where: { keyName: 'FACULTY_CODE' } });
            if (!config || config.codeValue !== facultyCode) {
                return res.status(403).json({ message: 'Invalid credentials or code.' });
            }
        }

        // 1. CREATE THE TOKEN *FIRST*
        const token = jwt.sign(
            { id: user.id, role: user.role, mustChangePassword: user.mustChangePassword || false },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        // 2. CHECK FOR PASSWORD CHANGE
        if (user.mustChangePassword) {
            // 3. SEND THE TOKEN *WITH* THE 202 RESPONSE
            return res.status(202).json({ 
                message: 'Mandatory password change required.', 
                mustChangePassword: true,
                email: user.email,
                token: token // <-- THIS IS THE FIX
            });
        }
        
        // Regular login response
        res.status(200).json({ token, role: user.role });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal login error.' });
    }
};

// --- FUNCTION 3: forcePasswordChange (This was missing) ---
const forcePasswordChange = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // 1. Verify Old Password
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) return res.status(400).json({ message: 'Old password incorrect. Change failed.' });

        // 2. Hash and Update Password
        const hashed = await bcrypt.hash(newPassword, 10);
        await user.update({
            password: hashed,
            mustChangePassword: false // <-- Flips the flag
        });

        res.status(200).json({ message: 'Password updated successfully. Please log in with your new password.' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password.' });
    }
};

// --- FINAL EXPORT: All 3 functions must be here ---
export { registerUser, loginUser, forcePasswordChange };