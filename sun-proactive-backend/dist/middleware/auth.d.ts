import { FastifyRequest, FastifyReply } from 'fastify';
export interface JwtPayload {
    id: string;
    role: string;
    isApproved: boolean;
}
export declare function signToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
export declare function authGuard(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function adminGuard(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
//# sourceMappingURL=auth.d.ts.map