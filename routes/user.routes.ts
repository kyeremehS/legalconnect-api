import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateSchema, validateParams } from '../middlewares/validation.middleware';
import { registerUserDto, updateUserDto, userParamsDto, loginDto } from '../Dto';

const userouter = Router();
const userController = new UserController();

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
userouter.post('/register', 
    validateSchema(registerUserDto), 
    userController.register.bind(userController)
);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
userouter.post('/login', 
    validateSchema(loginDto), 
    userController.login.bind(userController)
);

// @route   GET /api/users
// @desc    Get all users
// @access  Public (should be protected in production)
userouter.get('/', userController.getAllUsers.bind(userController));

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public (should be protected in production)
userouter.get('/:id', 
    validateParams(userParamsDto),
    userController.getUserById.bind(userController)
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (should be protected in production)
userouter.put('/:id', 
    validateParams(userParamsDto),
    validateSchema(updateUserDto),
    userController.updateUser.bind(userController)
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (should be protected in production)
userouter.delete('/:id', 
    validateParams(userParamsDto),
    userController.deleteUser.bind(userController)
);

export default userouter;
