import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/\d/, "Include a number"),
  orgName: z.string().min(2, "Enter your business name").max(80),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "manager", "agent", "finance", "viewer"]),
});
export type InviteInput = z.infer<typeof inviteSchema>;
