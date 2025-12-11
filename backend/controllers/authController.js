const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const sanitizeEmail = (email = '') => email.trim().toLowerCase();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
    // 1. Revisar errores de validacion
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    const email = sanitizeEmail(req.body.email);
    const { password } = req.body;

    // 2. Verificar duplicados
    let user = await User.findOne({ email });
    if (user) {
        res.status(400);
        throw new Error('User already exists');
    }

    // 3. Crear Usuario
    user = new User({
        email,
        password
    });

    // 4. Encriptar Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save(); // Guarda el usuario en la base de datos de mongodb atlas. 

    // 5. Generar Token
    const payload = { user: { id: user.id } };
    
    // Usamos version sincrona para asegurar que asyncHandler capture errores
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5d' }
    );

    res.json({ token });
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    // 1. Revisar errores de validacion
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    const email = sanitizeEmail(req.body.email);
    const { password } = req.body;

    // 2. Buscar usuario
    let user = await User.findOne({ email });
    if (!user) {
        res.status(400);
        throw new Error('Invalid Credentials');
    }

    // 3. Verificar password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid Credentials');
    }

    // 4. Generar Token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5d' }
    );

    res.json({ token });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.me = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json(user);
});

// @desc    Logout (stateless JWT: el cliente borra el token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
    // Con JWT sin estado, "logout" se maneja en el cliente borrando el token.
    // Devolvemos mensaje para que el frontend lo sepa.
    res.json({ msg: 'Logged out. Please delete token on client.' });
});
