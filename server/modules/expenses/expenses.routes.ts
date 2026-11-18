import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import {
  CreateExpenseSchema,
  UpdateBudgetSchema,
  UpdateSettlementStatusSchema,
} from '../../../src/lib/contracts/expense.schemas.js';
import { notFound } from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getRequiredAuth,
  getRequiredTripAccess,
  requireAuth,
  requireTripRole,
} from '../../middleware/auth.js';
import { createTripExpense, upsertTripBudget } from './expenses.service.js';
import {
  deleteTripExpense,
  updateTripSettlementStatus,
} from './settlements.service.js';

export function createExpensesRouter(
  prisma: PrismaClient | undefined,
  onTripChanged?: (tripId: string) => void,
): Router {
  const router = Router();
  const requireEditors = requireTripRole(prisma, ['OWNER', 'EDITOR']);
  const requireContributors = requireTripRole(prisma, [
    'OWNER',
    'EDITOR',
    'MEMBER',
  ]);

  router.put(
    '/trips/:tripId/budget',
    requireAuth,
    requireEditors,
    asyncHandler(async (req, res) => {
      const tripId = req.params.tripId;
      if (typeof tripId !== 'string') throw notFound('Trip not found.');
      const input = UpdateBudgetSchema.parse(req.body);
      await upsertTripBudget(prisma, tripId, input);
      onTripChanged?.(tripId);
      sendOk(res, { updated: true });
    }),
  );

  router.post(
    '/trips/:tripId/expenses',
    requireAuth,
    requireContributors,
    asyncHandler(async (req, res) => {
      const tripId = req.params.tripId;
      if (typeof tripId !== 'string') throw notFound('Trip not found.');
      const input = CreateExpenseSchema.parse(req.body);
      const out = await createTripExpense(prisma, tripId, input);
      onTripChanged?.(tripId);
      sendOk(res, out, 201);
    }),
  );

  router.delete(
    '/trips/:tripId/expenses/:expenseId',
    requireAuth,
    requireContributors,
    asyncHandler(async (req, res) => {
      const { tripId, expenseId } = req.params;
      if (typeof tripId !== 'string' || typeof expenseId !== 'string') {
        throw notFound('Expense not found.');
      }
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      await deleteTripExpense(
        prisma,
        tripId,
        expenseId,
        auth.user.id,
        access.role,
      );
      onTripChanged?.(tripId);
      sendOk(res, { deleted: true });
    }),
  );

  router.patch(
    '/trips/:tripId/settlements/:settlementId',
    requireAuth,
    requireContributors,
    asyncHandler(async (req, res) => {
      const { tripId, settlementId } = req.params;
      if (typeof tripId !== 'string' || typeof settlementId !== 'string') {
        throw notFound('Settlement not found.');
      }
      const { status } = UpdateSettlementStatusSchema.parse(req.body);
      await updateTripSettlementStatus(prisma, tripId, settlementId, status);
      onTripChanged?.(tripId);
      sendOk(res, { status });
    }),
  );

  return router;
}
