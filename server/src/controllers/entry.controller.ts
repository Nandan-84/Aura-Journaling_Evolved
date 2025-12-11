import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

// --- ENCRYPTION CONFIG ---
// In a real app, put these in .env!
// Key must be 32 bytes (32 chars)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012"; 
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    return "[Encrypted Content]"; // Fallback if key changes
  }
}

// --- CONTROLLER ---

const EntrySchema = z.object({
  content: z.string().min(1),
  mood: z.string(),
});

export const createEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { content, mood } = EntrySchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // ENCRYPT BEFORE SAVING
    const encryptedContent = encrypt(content);

    const entry = await prisma.entry.create({
      data: {
        content: encryptedContent, // Store gibberish
        mood,
        userId,
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error("Save Error:", error);
    res.status(400).json({ error: "Failed to save entry" });
  }
};

export const getEntries = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const entries = await prisma.entry.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        // DECRYPT BEFORE SENDING BACK
        const decryptedEntries = entries.map(entry => ({
            ...entry,
            content: decrypt(entry.content)
        }));

        res.json(decryptedEntries);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch entries" });
    }
}