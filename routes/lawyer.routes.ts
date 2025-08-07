import { Router } from 'express';
import { LawyerController } from '../controllers/lawyer.controller';
import { validateSchema, validateParams } from '../middlewares/validation.middleware';
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
// @access  Public
lawyerRouter.get('/', lawyerController.getAllLawyers.bind(lawyerController));

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

// @route   GET /api/lawyers/user/:userId
// @desc    Get lawyer by user ID
// @access  Public
lawyerRouter.get('/user/:userId', 
    validateParams(userIdParamsDto),
    lawyerController.getLawyerByUserId.bind(lawyerController)
);

// @route   POST /api/lawyers
// @desc    Create a new lawyer profile
// @access  Private (should be protected in production)
lawyerRouter.post('/', 
    validateSchema(createLawyerDto),
    lawyerController.createLawyer.bind(lawyerController)
);

// @route   PUT /api/lawyers/:id
// @desc    Update lawyer profile
// @access  Private (should be protected in production)
lawyerRouter.put('/:id', 
    validateParams(lawyerParamsDto),
    validateSchema(updateLawyerDto),
    lawyerController.updateLawyer.bind(lawyerController)
);

// @route   DELETE /api/lawyers/:id
// @desc    Delete lawyer profile
// @access  Private (should be protected in production)
lawyerRouter.delete('/:id', 
    validateParams(lawyerParamsDto),
    lawyerController.deleteLawyer.bind(lawyerController)
);

export default lawyerRouter;
