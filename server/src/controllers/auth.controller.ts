import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Validation Schemas
const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

// ==========================================
// 1. REGISTER
// ==========================================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = RegisterSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });

    const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.status(201).json({ message: "User created", userId: user.id, user: { name: user.name, email: user.email } });
  } catch (error: any) {
    res.status(400).json({ error: "Invalid input" });
  }
};

// ==========================================
// 2. LOGIN
// ==========================================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: "Login successful", user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: "Login failed" });
  }
};

// ==========================================
// 3. LOGOUT
// ==========================================
export const logout = (req: Request, res: Response) => {
  res.clearCookie('token'); 
  res.json({ message: "Logged out" });
};

// ==========================================
// 4. FORGOT PASSWORD
// ==========================================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Security: Always return success even if email is not found
    if (!user) {
      return res.json({ message: "If the email exists, a reset link was sent." });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Create Date object for 15 mins in the future
    // Variable name matches DB column 'resetTokenExp'
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000); 

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExp, // This now matches your schema
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      to: email,
      subject: 'Aura – Password Reset',
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Password reset link sent." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to send reset link" });
  }
};

// ==========================================
// 5. RESET PASSWORD
// ==========================================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = ResetPasswordSchema.parse(req.body);

    // Find user with valid token AND valid expiry
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { // Matches your schema
          gt: new Date(), // "Greater Than" current time
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null, // Matches your schema
      },
    });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ error: "Password reset failed" });
  }
};