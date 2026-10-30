import { z } from 'zod';

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());

function passwordMustNotContainEmailLocalPart(password, email) {
  if (!email || typeof email !== 'string') {
    return true;
  }
  const local = email.split('@')[0]?.toLowerCase();
  if (!local || local.length < 2) {
    return true;
  }
  return !password.toLowerCase().includes(local);
}

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters');

export const registerBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().max(100).optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!passwordMustNotContainEmailLocalPart(data.password, data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password must not contain your email local part',
      });
    }
  });

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

export const emailOnlyBodySchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const tokenBodySchema = z
  .object({
    token: z.string().trim().min(1),
  })
  .strict();

export const resetPasswordBodySchema = z
  .object({
    token: z.string().trim().min(1),
    newPassword: passwordSchema,
  })
  .strict();

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
