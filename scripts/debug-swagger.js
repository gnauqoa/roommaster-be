// Debug script to check Swagger configuration
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const config = {
  env: process.env.NODE_ENV || 'development'
};

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Roommaster API',
    version: '1.0.0'
  }
};

const options = {
  swaggerDefinition,
  apis:
    config.env === 'production'
      ? [
          path.join(process.cwd(), 'build/src/routes/**/*.js'),
          path.join(process.cwd(), 'build/src/controllers/**/*.js')
        ]
      : [
          path.join(process.cwd(), 'src/routes/**/*.ts'),
          path.join(process.cwd(), 'src/controllers/**/*.ts')
        ]
};

console.log('Environment:', config.env);
console.log('Current working directory:', process.cwd());
console.log('API paths to scan:', options.apis);

const spec = swaggerJsdoc(options);
console.log('\nSwagger spec paths found:', Object.keys(spec.paths || {}).length);
console.log('Paths:', Object.keys(spec.paths || {}));
