import { Router } from 'express';
import { LawyerController } from '../controllers/lawyer.controller';
import { validateSchema, validateParams } from '../middlewares/validation.middleware';
import { authenticate, authorize, requireOwnership, optionalAuth, rateLimit } from '../middlewares/Auth.middleware';
import { 
    createLawyerDto, 
    updateLawyerDto, 
    lawyerParamsDto,
    userIdParamsDto 
} from '../Dto';

const lawyerRouter = Router();
const lawyerController = new LawyerController();

// @route   GET /api/lawyers
// @desc    Get all lawyers
// @access  Public (with optional user context for personalized results)
lawyerRouter.get('/', 
    optionalAuth,
    lawyerController.getAllLawyers.bind(lawyerController)
);

// @route   GET /api/lawyers/search/practice-areas
// @desc    Search lawyers by practice areas
// @access  Public
lawyerRouter.get('/search/practice-areas', lawyerController.searchByPracticeAreas.bind(lawyerController));

// @route   GET /api/lawyers/search/location
// @desc    Search lawyers by location
// @access  Public
lawyerRouter.get('/search/location', lawyerController.searchByLocation.bind(lawyerController));

// @route   GET /api/lawyers/:id
// @desc    Get lawyer by ID
// @access  Public
lawyerRouter.get('/:id', 
    validateParams(lawyerParamsDto),
    lawyerController.getLawyerById.bind(lawyerController)
);

// @route   GET /api/lawyers/profile/me
// @desc    Get current user's lawyer profile
// @access  Private (Authenticated lawyers)
lawyerRouter.get('/profile/me', 
    authenticate,
    authorize('LAWYER', 'ADMIN'),
    (req, res) => {
        // TODO: Implement getCurrentLawyerProfile in LawyerController
        res.json({ 
            success: true, 
            message: 'Get current lawyer profile endpoint - implement in controller',
            user: req.user 
        });
    }
);

// @route   GET /api/lawyers/user/:userId
// @desc    Get lawyer by user ID
// @access  Private (User or Admin can access)
lawyerRouter.get('/user/:userId', 
    authenticate,
    validateParams(userIdParamsDto),
    requireOwnership,
    lawyerController.getLawyerByUserId.bind(lawyerController)
);

// @route   POST /api/lawyers/register
// @desc    Register a new lawyer (user + lawyer profile)
// @access  Public
lawyerRouter.post('/register', 
    rateLimit(5, 60 * 60 * 1000), // 5 registrations per hour
    lawyerController.registerLawyer.bind(lawyerController)
);

// @route   POST /api/lawyers
// @desc    Create a new lawyer profile
// @access  Private (Authenticated users, preferably lawyers/admins)
lawyerRouter.post('/', 
    authenticate,
    authorize('LAWYER', 'ADMIN'),
    rateLimit(5, 60 * 60 * 1000), // 5 profile creations per hour
    validateSchema(createLawyerDto),
    lawyerController.createLawyer.bind(lawyerController)
);

// @route   PUT /api/lawyers/:id
// @desc    Update lawyer profile
// @access  Private (Lawyer owns profile or Admin)
lawyerRouter.put('/:id', 
    authenticate,
    validateParams(lawyerParamsDto),
    authorize('LAWYER', 'ADMIN'),
    rateLimit(10, 60 * 60 * 1000), // 10 updates per hour
    validateSchema(updateLawyerDto),
    lawyerController.updateLawyer.bind(lawyerController)
);

// @route   DELETE /api/lawyers/:id
// @desc    Delete lawyer profile
// @access  Private (Admin only or lawyer owns profile)
lawyerRouter.delete('/:id', 
    authenticate,
    validateParams(lawyerParamsDto),
    authorize('LAWYER', 'ADMIN'),
    rateLimit(3, 24 * 60 * 60 * 1000), // 3 deletions per day
    lawyerController.deleteLawyer.bind(lawyerController)
);

export default lawyerRouter;
