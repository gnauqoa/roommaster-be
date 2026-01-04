import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import config from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Roommaster API Documentation',
    version: '1.0.0',
    description: 'REST API documentation for Roommaster application',
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    },
    contact: {
      name: 'API Support',
      email: 'support@roommaster.com'
    }
  },
  servers: [
    {
      url: config.apiUrl || `http://localhost:${config.port}/v1`,
      description: config.env === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token'
      }
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: {
                  type: 'number',
                  example: 401
                },
                message: {
                  type: 'string',
                  example: 'Please authenticate'
                }
              }
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: {
                  type: 'number',
                  example: 403
                },
                message: {
                  type: 'string',
                  example: 'Forbidden'
                }
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: {
                  type: 'number',
                  example: 404
                },
                message: {
                  type: 'string',
                  example: 'Not found'
                }
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: {
                  type: 'number',
                  example: 400
                },
                message: {
                  type: 'string',
                  example: 'Validation error'
                },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string'
                      },
                      message: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  // Path to the API routes - use source files for swagger-jsdoc to read JSDoc comments
  // JSDoc comments are not preserved in compiled JavaScript files
  apis: [
    path.join(process.cwd(), 'src/routes/**/*.ts'),
    path.join(process.cwd(), 'src/controllers/**/*.ts')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
