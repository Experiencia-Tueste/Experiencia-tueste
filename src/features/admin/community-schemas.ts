import { z } from 'zod';

const reason = z.string().trim().min(3).max(300);
const optionalUuid = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().uuid().optional(),
);

export const COMMUNITY_MEMBER_SCHEMA = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  notes: z.string().trim().max(1000).optional(),
  reason,
});

export const COMMUNITY_POST_SCHEMA = z.object({
  memberId: optionalUuid,
  authorName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(5000),
  reason,
});

export const COMMUNITY_REPORT_SCHEMA = z.object({
  postId: z.string().uuid(),
  reporterName: z.string().trim().min(1).max(120),
  category: z.enum(['spam', 'harassment', 'misinformation', 'copyright', 'other']),
  details: z.string().trim().max(2000).optional(),
  reason,
});

export const COMMUNITY_MEMBER_STATUS_SCHEMA = z.object({
  id: z.string().uuid(),
  from: z.enum(['active', 'restricted', 'banned']),
  to: z.enum(['active', 'restricted', 'banned']),
  reason,
});

export const COMMUNITY_POST_STATUS_SCHEMA = z.object({
  id: z.string().uuid(),
  from: z.enum(['visible', 'hidden', 'removed']),
  to: z.enum(['visible', 'hidden', 'removed']),
  reason,
});

export const COMMUNITY_REPORT_STATUS_SCHEMA = z.object({
  id: z.string().uuid(),
  from: z.literal('open'),
  to: z.enum(['resolved', 'dismissed']),
  resolution: z.string().trim().min(3).max(1000),
  reason,
});

export function isCommunityStatusChange(from: string, to: string) {
  return from !== to;
}
