import { z } from 'zod'

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Profile validation schema
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  instagram_handle: z
    .string()
    .max(30, 'Instagram handle must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_.]*$/, 'Instagram handle can only contain letters, numbers, dots, and underscores')
    .optional()
    .or(z.literal('')),
  dance_preferences: z.array(z.string()).optional(),
})

// Search validation
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters'),
})

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type SearchFormData = z.infer<typeof searchSchema>

// Validation helper
export const validateField = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    schema.parse(data)
    return { success: true, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Validation failed'
      }
    }
    return { success: false, error: 'Validation failed' }
  }
}