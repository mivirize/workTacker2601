import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import { UnauthorizedError } from '../lib/errors.js';
import type { JwtPayload } from '@faqai/types';

declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
      role: JwtPayload['role'];
      sessionId: string;
    };
    organizationId: string;
    jwtPayload: JwtPayload;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authorization.slice(7);
  const jwtSecret = process.env['JWT_SECRET'];

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const jwtPayload = payload as unknown as JwtPayload;

    if (!jwtPayload.userId || !jwtPayload.organizationId || !jwtPayload.role) {
      throw new UnauthorizedError('Invalid token payload');
    }

    c.set('user', {
      id: jwtPayload.userId,
      email: (payload['email'] as string | undefined) ?? '',
      role: jwtPayload.role,
      sessionId: jwtPayload.sessionId,
    });
    c.set('organizationId', jwtPayload.organizationId);
    c.set('jwtPayload', jwtPayload);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }

  await next();
});
