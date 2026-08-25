import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import studentRoutes from './routes/student.routes.js';
import studentAuthRoutes from './routes/student-auth.routes.js';
import studentProfileRoutes from './routes/student-profile.routes.js';
import departmentRoutes from './routes/department.routes.js';
import programmeRoutes from './routes/programme.routes.js';
import academicRecordRoutes from './routes/academic-record.routes.js';
import userRoutes from './routes/user.routes.js';
import activityLogRoutes from './routes/activity-log.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use('/api', (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'Student Information Management System API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/student/profile', studentProfileRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/academic-records', academicRecordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const requestError = error as { type?: string; status?: number };
  if (requestError.type === 'entity.parse.failed') {
    response.status(400).json({ success: false, message: 'Request body must contain valid JSON.' });
    return;
  }
  if (requestError.type === 'entity.too.large' || requestError.status === 413) {
    response.status(413).json({ success: false, message: 'Request body is too large.' });
    return;
  }

  console.error('Unhandled API error:', error instanceof Error ? error.message : 'Unknown error');
  response.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

app.use((_request, response) => {
  response.status(404).json({ success: false, message: 'API endpoint not found.' });
});

export default app;
