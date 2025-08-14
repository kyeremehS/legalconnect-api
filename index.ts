import express from 'express';
import cors from 'cors';
import userouter from './routes/user.routes';
import lawyerRouter from './routes/lawyer.routes';
import appointmentRouter from './routes/appointment.routes';
import certificateRouter from './routes/certificate.routes';
import adminVerificationRouter from './routes/admin-verification.routes';
import lawyerRegistrationRouter from './routes/lawyer-registration.routes';
import uploadRouter from './routes/upload.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the LegalConnect API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      lawyers: '/api/lawyers',
      lawyerRegistration: '/api/lawyer-registration',
      uploads: '/api/uploads',
      appointments: '/api/appointments',
      certificates: '/api/certificates',
      adminVerifications: '/api/admin/verifications',
      health: '/health'
    },
    certificateEndpoints: {
      verify: 'POST /api/certificates/verify',
      search: 'GET /api/certificates/search?name=<lawyer_name>',
      lookup: 'GET /api/certificates/lookup?number=<cert_number>',
      getByNumber: 'GET /api/certificates/number/<cert_number>',
      legacy: 'GET /api/certificates/<cert_number>'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/users', userouter);
app.use('/api/lawyers', lawyerRouter);
app.use('/api/lawyer-registration', lawyerRegistrationRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/certificates', certificateRouter);
app.use('/api/admin/verifications', adminVerificationRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
});