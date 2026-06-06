const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

async function registerUser(req, res) {
    try {
        const { username, password, email, role = 'user' } = req.body;

        const userAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }],
        });
        if (userAlreadyExists) {
            return res.status(409).json({ message: 'user already exists' });
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            username,
            password: hash,
            email,
            role
        });

        const token = jwt.sign(
            {
                id: newUser._id,
                role: newUser.role,
            },
            process.env.JWT_SECRET
        );

        res.cookie('token', token);
        return res.status(201).json({
            message: 'user registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'registration failed', error: err.message });
    }
}

async function loginUser(req, res) {
    const { username, email, password } = req.body;

    const user = await userModel.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid Password" })
    }
    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET);

    res.cookie('token', token);

    res.status(200).json({
        message: "Login successful",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    })
}

async function logoutUser(req, res) {
    res.clearCookie("token")
    res.status(200).json({ message: "logged out successfully" })
}


module.exports = { registerUser, loginUser, logoutUser };