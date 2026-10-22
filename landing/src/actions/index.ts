/**
 * Astro 6 Server Actions (`astro:actions` + `astro:schema`)
 * First-party typed POST RPC layer for ScamKill family leads, scam reports, and safe-word checks.
 */

import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { env } from 'cloudflare:workers';
import { generateId } from '../lib/auth';
import { createLead, createReport } from '../lib/store';

export const server = {
  registerFamilyLead: defineAction({
    input: z.object({
      name: z.string().trim().min(2, 'Vui lòng nhập họ tên.'),
      phone: z.string().trim().min(9, 'Số điện thoại chưa đúng định dạng Việt Nam.'),
      role: z.enum(['senior', 'family', 'bank', 'telco', 'other']).default('family'),
      city: z.string().trim().optional(),
      consent: z.boolean().refine((v) => v === true, 'Cần đồng ý để chúng tôi liên hệ tư vấn.'),
    }),
    handler: async (input) => {
      const cleanPhone = input.phone.replace(/[^\d+]/g, '');
      if (cleanPhone.length < 9 || cleanPhone.length > 15) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Số điện thoại chưa đúng định dạng Việt Nam.',
        });
      }

      const row = {
        id: generateId(12),
        name: input.name.slice(0, 80),
        phone: cleanPhone,
        role: input.role,
        city: input.city ? input.city.slice(0, 80) : null,
        consent: true,
        source: 'astro-action',
        createdAt: Date.now(),
      };

      await createLead(env?.DB, row);
      return {
        ok: true as const,
        id: row.id,
        engine: 'astro:actions',
      };
    },
  }),

  submitCommunityReport: defineAction({
    input: z.object({
      phoneWatched: z.string().trim().min(6),
      category: z.enum(['police_impersonation', 'relative_emergency', 'bank_otp', 'unknown_suspicious']),
      summary: z.string().trim().min(5).max(500),
    }),
    handler: async (input, context) => {
      const row = {
        id: generateId(12),
        reporterName: context.locals.user?.name ?? null,
        phoneNumber: input.phoneWatched.slice(0, 32),
        channel: 'phone',
        category: input.category,
        description: input.summary,
        status: input.category === 'unknown_suspicious' ? 'caution' : 'high_risk',
        createdAt: Date.now(),
      };

      await createReport(env?.DB, row);
      return {
        ok: true as const,
        id: row.id,
        riskLevel: row.status,
        engine: 'astro:actions',
      };
    },
  }),
};
