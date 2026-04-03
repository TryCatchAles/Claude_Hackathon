'use server'

export async function signUp(formData: FormData) {
  // TODO: create user, send email OTP
}

export async function signIn(formData: FormData) {
  // TODO: authenticate with Supabase Auth
}

export async function verifyOtp(email: string, token: string) {
  // TODO: verify email OTP
}
