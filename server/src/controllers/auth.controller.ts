import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const VerifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
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


const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  dob: z.string().optional(), 
  gender: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

const DeleteAccountSchema = z.object({
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = RegisterSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000); 
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
        if (existing.isVerified) {
            return res.status(400).json({ error: "User already exists" });
        } else {
            await prisma.user.update({
                where: { email },
                data: { name, password: hashedPassword, otp, otpExp }
            });
        }
    } else {
        await prisma.user.create({
          data: { name, email, password: hashedPassword, isVerified: false, otp, otpExp }
        });
    }

    console.log(`🔐 REGISTRATION OTP for ${email}: ${otp}`);

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          to: email,
          subject: 'Aura – Verify your account',
          html: `<h1>Welcome!</h1><p>Code: ${otp}</p>`,
        });
      }
    } catch (e) {}

    res.status(201).json({ message: "OTP sent." });
  } catch (error) {
    res.status(400).json({ error: "Invalid input" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
   try {
    const { email, otp } = VerifyEmailSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Verified" });
    if (user.otp !== otp || !user.otpExp || new Date() > user.otpExp) return res.status(400).json({ error: "Invalid OTP" });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExp: null },
    });
    
    const token = jwt.sign({ userId: updatedUser.id, name: updatedUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ message: "Verified", user: { name: updatedUser.name, email: updatedUser.email } });
  } catch (error) {
    res.status(400).json({ error: "Verification failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: "Invalid credentials" });
    if (!user.isVerified) return res.status(403).json({ error: "Verify email first" });

    const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ message: "Login successful", user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: "Login failed" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token'); 
  res.json({ message: "Logged out" });
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: "If email exists, link sent." });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000); 
    await prisma.user.update({ where: { email }, data: { resetToken, resetTokenExp } });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log("RESET LINK:", resetLink);

    try {
        if (process.env.EMAIL_USER) {
            await transporter.sendMail({ to: email, subject: 'Reset Password', html: `<a href="${resetLink}">Reset</a>` });
        }
    } catch (e) {}
    res.json({ message: "Link generated" });
  } catch (error) {
    res.status(400).json({ error: "Failed" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
   try {
    const { token, password } = ResetPasswordSchema.parse(req.body);
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExp: { gt: new Date() } } });
    if (!user) return res.status(400).json({ error: "Invalid token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, resetToken: null, resetTokenExp: null } });
    res.json({ message: "Password reset" });
  } catch (error) {
    res.status(400).json({ error: "Failed" });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, dob: true, gender: true } 
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, dob, gender } = UpdateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        gender,
        dob: dob ? new Date(dob) : undefined,
      },
    });

    res.json({ message: "Profile updated", user: { name: updatedUser.name } });
  } catch (error) {
    res.status(400).json({ error: "Update failed" });
  }
};
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ error: "Change password failed" });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { password } = DeleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Incorrect password" });

    await prisma.entry.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.clearCookie('token');
    res.json({ message: "Account deleted permanently" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Delete account failed" });
  }
};