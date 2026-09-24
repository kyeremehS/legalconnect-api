import jwt from 'jsonwebtoken';


export const acessToken = (user : { id: string, email: string, role: string }): string => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        throw new Error('JWT_SECRET is not configured. Set it in .env');
    }
    const options = {
        expiresIn: '7d' as const
    };
    return jwt.sign(payload, secretKey, options);
}