const nodemailer = require('nodemailer');

const isDev = process.env.NODE_ENV !== 'production';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  if (isDev) {
    console.log('\n──────────────────────────────────────');
    console.log(`[DEV] OTP for ${toEmail} → ${otp}`);
    console.log('Expires in 10 minutes');
    console.log('──────────────────────────────────────\n');
    return;
  }

  await transporter.sendMail({
    from: `"Hafla" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Hafla login code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF8F3;border-radius:12px;">
        <h2 style="color:#0B3D2E;margin-bottom:8px;">Your login code</h2>
        <p style="color:#66766C;margin-bottom:24px;">Use this code to complete your sign-in to Hafla. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fff;border:2px solid #C9A24B;border-radius:10px;padding:20px 32px;text-align:center;letter-spacing:10px;font-size:36px;font-weight:800;color:#0B3D2E;">
          ${otp}
        </div>
        <p style="color:#8A968D;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
