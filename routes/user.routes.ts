import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateSchema, validateParams } from '../middlewares/validation.middleware';
import { authenticate, authorize, requireOwnership, rateLimit } from '../middlewares/Auth.middleware';
import { registerUserDto, updateUserDto, userParamsDto, loginDto } from '../Dto';

const userouter = Router();
const userController = new UserController();

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public (with rate limiting)
userouter.post('/register', 
    rateLimit(5, 15 * 60 * 1000), // 5 registrations per 15 minutes
    validateSchema(registerUserDto), 
    userController.register.bind(userController)
);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public (with rate limiting)
userouter.post('/login', 
    rateLimit(10, 15 * 60 * 1000), // 10 login attempts per 15 minutes
    validateSchema(loginDto), 
    userController.login.bind(userController)
);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
userouter.get('/', 
    authenticate,
    authorize('ADMIN'),
    userController.getAllUsers.bind(userController)
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (User or Admin)
userouter.get('/:id', 
    authenticate,
    validateParams(userParamsDto),
    requireOwnership,
    userController.getUserById.bind(userController)
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (User or Admin)
userouter.put('/:id', 
    authenticate,
    validateParams(userParamsDto),
    requireOwnership,
    validateSchema(updateUserDto),
    userController.updateUser.bind(userController)
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (User or Admin)
userouter.delete('/:id', 
    authenticate,
    validateParams(userParamsDto),
    requireOwnership,
    userController.deleteUser.bind(userController)
);

// @route   GET /api/users/profile/me
// @desc    Get current user profile
// @access  Private
userouter.get('/profile/me', 
    authenticate,
    (req, res) => {
        res.json({ success: true, data: req.user });
    }
);

export default userouter;
