'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, User, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signUpSchema, SignUpFormData } from '@/lib/validation'
import Link from 'next/link'

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [showResendButton, setShowResendButton] = useState(false)
  
  const { user, loading, signUp, resendConfirmation } = useAuth()
  const router = useRouter()

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('User already authenticated, redirecting to events')
      router.push('/events')
    }
  }, [user, loading, router])

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    )
  }

  // If user is authenticated, don't render the form (redirect will happen)
  if (user) {
    return null
  }

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true)
    setAuthError(null)
    setConfirmationEmail(null)

    try {
      const { error, needsConfirmation } = await signUp(data.email, data.password, data.fullName)
      
      if (error) {
        if (error.message.includes('already registered')) {
          setAuthError('An account with this email already exists. Try signing in instead.')
        } else {
          setAuthError(error.message)
        }
      } else if (needsConfirmation) {
        setConfirmationEmail(data.email)
        setShowResendButton(true)
        setAuthError(null)
      } else {
        router.push('/events')
      }
    } catch {
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return
    
    setIsLoading(true)
    try {
      const { error } = await resendConfirmation(confirmationEmail)
      if (error) {
        setAuthError(error.message)
      } else {
        setAuthError('Confirmation email sent! Please check your inbox.')
      }
    } catch {
      setAuthError('Failed to resend confirmation email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <Link 
              href="/auth/login"
              className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="text-sm">Back to sign in</span>
            </Link>
            
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Join BailaCheck
            </h1>
            <p className="text-gray-600 text-sm">
              Create your account to start discovering Latin dance events
            </p>
          </div>

          <div className="px-8 pb-8">
            {authError && !confirmationEmail && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}

            {confirmationEmail && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm mb-2">
                  Almost there! We&apos;ve sent a confirmation email to <strong>{confirmationEmail}</strong>
                </p>
                <p className="text-blue-700 text-xs mb-3">
                  Please check your inbox and click the confirmation link to activate your account.
                </p>
                {showResendButton && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50"
                  >
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}

            {!confirmationEmail && (
              <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...form.register('fullName')}
                      type="text"
                      id="fullName"
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      placeholder="Your full name"
                    />
                  </div>
                  {form.formState.errors.fullName && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...form.register('email')}
                      type="email"
                      id="email"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      placeholder="your@email.com"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      placeholder="Choose a secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...form.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}

            {/* Terms and Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-4">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
              
              {!confirmationEmail && (
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    href="/auth/login" 
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-white/80 text-sm">
            Join thousands of dancers discovering amazing events! 💃🕺
          </p>
        </div>
      </div>
    </div>
  )
}