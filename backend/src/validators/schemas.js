/**
 * CodeSense AI — Zod validation schemas.
 *
 * Authoritative request/response validation shapes shared across auth and
 * review boundaries.
 */

const z = require('zod');

const emailSchema = z
  .string({ required_error: 'Email is required.' })
  .min(1, 'Email is required.')
  .max(254, 'Email is too long.')
  .email('Enter a valid email address.');

const passwordSchema = z
  .string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');

const languageIdSchema = z
  .string({ required_error: 'Language is required.' })
  .min(1, 'Language is required.')
  .max(64, 'Language identifier is too long.');

const optionalTitleSchema = z
  .string()
  .max(200, 'Title is too long.')
  .optional()
  .nullable();

const clientRequestIdSchema = z
  .string()
  .max(128, 'Client request ID is too long.')
  .optional()
  .nullable();

// --- Auth ---
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required.' }),
});

// --- Review ---
const createReviewSchema = z.object({
  source: z
    .string({ required_error: 'Source code is required.' })
    .min(1, 'Source code must not be empty.')
    .refine(
      (val) => Buffer.byteLength(val, 'utf8') > 0,
      'Source code must not be empty.'
    ),
  language: languageIdSchema,
  title: optionalTitleSchema,
  clientRequestId: clientRequestIdSchema,
});

// --- Review list query ---
const listReviewsSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer.')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'Page must be at least 1.')
    .optional()
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer.')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100.')
    .optional()
    .default('20'),
  language: z.string().max(64).optional().nullable(),
  status: z
    .enum(['accepted', 'processing', 'completed', 'failed'])
    .optional()
    .nullable(),
  sort: z
    .enum(['createdAt', 'updatedAt', 'language', 'status'])
    .optional()
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

module.exports = {
  registerSchema,
  loginSchema,
  createReviewSchema,
  listReviewsSchema,
  emailSchema,
  passwordSchema,
  languageIdSchema,
};
