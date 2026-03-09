import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth.js';
import { OrganizationRepository } from './organization.repository.js';
import type { ApiResponse } from '@faqai/types';

const organizationRoutes = new Hono();
const orgRepository = new OrganizationRepository();

// GET /api/v1/organizations/:id
organizationRoutes.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const contextOrgId = c.get('organizationId');

  // セキュリティ: JWT の organizationId と一致するか確認
  if (id !== contextOrgId) {
    return c.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      } satisfies ApiResponse,
      403,
    );
  }

  const org = await orgRepository.findOrganizationById(id);
  if (!org) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Organization not found' },
      } satisfies ApiResponse,
      404,
    );
  }

  return c.json(
    {
      success: true,
      data: { organization: org },
    } satisfies ApiResponse<{ organization: typeof org }>,
    200,
  );
});

// TODO(Phase 2): Implement organization creation with invite-based onboarding flow
organizationRoutes.post('/', authMiddleware, async (c) => {
  return c.json(
    {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented yet' },
    } satisfies ApiResponse,
    501,
  );
});

// TODO(Phase 2): Implement organization update (name, plan, settings)
organizationRoutes.patch('/:id', authMiddleware, async (c) => {
  return c.json(
    {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented yet' },
    } satisfies ApiResponse,
    501,
  );
});

// TODO(Phase 2): Implement member listing with role-based access control
organizationRoutes.get('/:id/members', authMiddleware, async (c) => {
  return c.json(
    {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented yet' },
    } satisfies ApiResponse,
    501,
  );
});

// TODO(Phase 2): Implement member invitation (email invite + role assignment)
organizationRoutes.post('/:id/members', authMiddleware, async (c) => {
  return c.json(
    {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented yet' },
    } satisfies ApiResponse,
    501,
  );
});

export { organizationRoutes };
