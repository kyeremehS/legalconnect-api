import jwt from 'jsonwebtoken';


export const acessToken = (user : { id: string, email: string, role: string }): string => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    const secretKey = process.env.JWT_SECRET   || 'default_secret_key';
    const options = {
        expiresIn: '30d' as const // Refresh token valid for 30 days
    };
    return jwt.sign(payload, secretKey, options);
}