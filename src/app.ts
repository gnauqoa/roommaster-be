import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import swaggerUi from 'swagger-ui-express';
import basicAuth from 'express-basic-auth';
import config from './config/env';
import morgan from './config/morgan';
import xss from './middlewares/xss';
import { jwtStrategy } from './config/passport';
import { authLimiter } from './middlewares/rateLimiter';
import { errorConverter, errorHandler } from './middlewares/error';
import ApiError from './utils/ApiError';
import { bootstrap } from './core/bootstrap';
import swaggerSpec from './config/swagger';
import createV1Routes from './routes/v1';

// Bootstrap DI container before using routes
bootstrap();

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
// Cast to express.RequestHandler to work around type mismatches between
// transitive @types packages (some depend on @types/express v5 while project
// uses v4). Prefer upgrading TypeScript and/or aligning @types packages in
// package.json/resolutions to fully fix; for now, use a narrow cast to keep
// the middleware typing compatible with app.use.
app.use(compression() as unknown as express.RequestHandler);

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// Swagger API documentation with basic authentication
app.use(
  '/api-docs',
  basicAuth({
    users: { [config.swagger.username]: config.swagger.password },
    challenge: true,
    realm: 'Roommaster API Documentation'
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Roommaster API Documentation'
  })
);

// v1 api routes
app.use('/v1', createV1Routes());

app.get('/', (req, res) => {
  res.send('Roommaster API');
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API server
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                   description: Health status of the API
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-01-10T03:14:05.575Z
 *                   description: Current server timestamp
 *                 uptime:
 *                   type: number
 *                   example: 588.595360349
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 *                   enum: [development, production, test]
 *                   description: Current environment
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env
  });
});

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
