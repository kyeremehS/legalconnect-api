// Export all DTOs for easy importing
export { 
    registerUserDto, 
    updateUserDto, 
    userParamsDto,
    loginDto 
} from './UserDto';

export {
    createLawyerDto,
    updateLawyerDto,
    lawyerParamsDto,
    userIdParamsDto
} from './LawyerDto';

export type { 
    RegisterUserInput, 
    UpdateUserInput, 
    UserParamsInput 
} from './UserDto';

export type {
    CreateLawyerInput,
    UpdateLawyerInput,
    LawyerParamsInput,
    UserIdParamsInput
} from './LawyerDto';
