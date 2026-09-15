import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email sending skipped (EMAIL_USER / EMAIL_PASS not set in .env)');
    return null;
  }
  try {
    const info = await transporter.sendMail({
      from: `"Realtime E2EE Chat" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};