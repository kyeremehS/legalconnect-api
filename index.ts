import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// Routers
import userouter from './routes/user.routes';
import lawyerRouter from './routes/lawyer.routes';
import appointmentRouter from './routes/appointment.routes';
import certificateRouter from './routes/certificate.routes';
import adminVerificationRouter from './routes/admin-verification.routes';
import lawyerRegistrationRouter from './routes/lawyer-registration.routes';
import uploadRouter from './routes/upload.routes';
import videoInteractionRouter from './routes/video-interaction.routes';
import messageRouter from './routes/message.routes';
import availabilityRouter from './routes/availability.routes';
import publicRouter from './routes/public.routes';
import dashboardRouter from './routes/dashboard.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// 👉 Create HTTP server & attach socket.io
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'https://legalconnect-gh.vercel.app',
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/legalconnect-gh.*\.vercel\.app$/
    ],
    methods: ['GET', 'POST']
  }
});

// Map to track online users (userId → socketId)
export const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`⚡ New socket connected: ${socket.id}`);

  // Register user when frontend sends userId after login
  socket.on('register', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
      }
    }
  });
});

// =================== Middleware ===================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'https://legalconnect-gh.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/legalconnect-gh.*\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// =================== Routes ===================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the LegalConnect API',
    version: '1.0.0',
    health: '/health'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routers
app.use('/api/users', userouter);
app.use('/api/lawyers', lawyerRouter);
app.use('/api/lawyer-registration', lawyerRegistrationRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/videos', videoInteractionRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/certificates', certificateRouter);
app.use('/api/admin/verifications', adminVerificationRouter);
app.use('/api/messages', messageRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/public', publicRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
