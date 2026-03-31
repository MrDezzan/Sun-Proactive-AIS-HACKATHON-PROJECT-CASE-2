import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'sun-proactive-super-secret-key-change-in-production';
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
// Fastify preHandler hook for protected routes
export async function authGuard(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized: No token provided' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return reply.status(401).send({ error: 'Unauthorized: Malformed token' });
        }
        const decoded = verifyToken(token);
        request.user = decoded;
    }
    catch (err) {
        return reply.status(401).send({ error: 'Unauthorized: Invalid or expired token' });
    }
}
// Admin-only guard
export async function adminGuard(request, reply) {
    await authGuard(request, reply);
    if (reply.sent)
        return;
    const user = request.user;
    if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden: Admin access required' });
    }
}
//# sourceMappingURL=auth.js.map