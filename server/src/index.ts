import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import entryRoutes from './routes/entry.routes'; // Import Entry Routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes); 

app.get('/', (req, res) => {
  res.json({ message: '🟢 Aura Backend is Breathing...' });
});

app.listen(PORT, () => {
  console.log(`\n⚡ Server is running at http://localhost:${PORT}`);
});