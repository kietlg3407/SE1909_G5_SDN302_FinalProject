const nodemailer = require('nodemailer');

const APP_PASSWORD_PLACEHOLDER = 'your_gmail_app_password_16_chars';

const hasSmtpConfig = () => {
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  return Boolean(process.env.EMAIL_USER && pass && pass !== APP_PASSWORD_PLACEHOLDER);
};

const createTransporter = () => {
  if (!hasSmtpConfig()) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.replace(/\s/g, ''),
    },
  });
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@shop.local';
  const safeName = name || 'bạn';
  const safeUrl = escapeHtml(resetUrl);
  const subject = 'Đặt lại mật khẩu';
  const text = [
    `Xin chào ${safeName},`,
    '',
    'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
    'Liên kết bên dưới có hiệu lực trong 15 phút và chỉ sử dụng được một lần:',
    resetUrl,
    '',
    'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
  ].join('\n');
  const html = `
    <p>Xin chào ${escapeHtml(safeName)},</p>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
    <p>Liên kết bên dưới có hiệu lực trong <strong>15 phút</strong> và chỉ sử dụng được một lần:</p>
    <p><a href="${safeUrl}">Đặt lại mật khẩu</a></p>
    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
  `;

  const info = await createTransporter().sendMail({ from, to, subject, text, html });

  if (!hasSmtpConfig() && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.info(`[mailer] SMTP chưa được cấu hình. Liên kết đặt lại mật khẩu (mock): ${resetUrl}`);
  }

  return info;
};

module.exports = { sendPasswordResetEmail };
