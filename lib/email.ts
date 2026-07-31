// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLink(email: string, token: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set')
  }

  const magicLinkUrl = `${appUrl}/api/auth/verify?token=${token}`

  const { error } = await resend.emails.send({
    from: 'Design Evolution <onboarding@resend.dev>',
    to: [email],
    subject: 'Your sign-in link for Design Evolution',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #0f1021;">
          Sign in to Design Evolution
        </h1>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
          Click the button below to sign in. This link expires in 15 minutes and can only be used once.
        </p>
        <a
          href="${magicLinkUrl}"
          style="
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
          "
        >
          Sign in
        </a>
        <p style="color: #8b93a8; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          If you didn't request this email, you can safely ignore it.<br />
          This link will expire at ${new Date(Date.now() + 15 * 60 * 1000).toUTCString()}.
        </p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Failed to send magic link email: ${error.message}`)
  }
}
