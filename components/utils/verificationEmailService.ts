/**
 * Email Verification Service
 * Sends verification codes to users during registration
 * Uses EmailJS (free email service)
 */

/**
 * Generates a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends verification code email using EmailJS
 */
export async function sendVerificationCodeEmail(
  recipientEmail: string,
  verificationCode: string,
  username: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check if EmailJS is configured (use provided defaults when env vars are missing)
    const emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_cpog5wn';
    // Use verification template ID (default to template_wa3zja6), fallback to regular template ID
    const emailjsTemplateId = import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID || 'template_wa3zja6' || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    
    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
      // EmailJS not configured - silently fail without exposing code
      return {
        success: false,
        error: 'Email service not configured. Please contact administrator.'
      };
    }
    
    // EmailJS template parameters for verification email
    const templateParams = {
      to_email: recipientEmail,
      to_name: username || recipientEmail.split('@')[0],
      verification_code: verificationCode,
      username: username,
      from_name: 'DICT Regional Calendar',
      subject: 'Email Verification Code - DICT Regional Calendar',
      message: `Your verification code is: ${verificationCode}`,
    };
    
    const response = await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsPublicKey,
        template_params: templateParams,
      }),
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      if (responseText === 'OK' || responseText.includes('OK')) {
        return { success: true, message: 'Verification code sent successfully' };
      }
      try {
        const data = JSON.parse(responseText);
        if (data.status === 'success' || data.text === 'OK') {
          return { success: true, message: 'Verification code sent successfully' };
        }
        return { success: false, error: data.text || data.message || 'Failed to send verification code' };
      } catch (e) {
        return { success: false, error: `EmailJS returned unexpected response: ${responseText}` };
      }
    } else {
      try {
        const data = JSON.parse(responseText);
        return { success: false, error: data.text || data.message || 'Failed to send verification code' };
      } catch (e) {
        return { success: false, error: `EmailJS API error: ${responseText}` };
      }
    }
  } catch (error) {
    console.error('Error sending verification code email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending verification code'
    };
  }
}
