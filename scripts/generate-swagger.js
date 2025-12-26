const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const swaggerJsdoc = require('swagger-jsdoc');

// Define the Swagger configuration
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
      url: 'http://localhost:3000/v1',
      description: 'Development server'
    },
    {
      url: 'https://api.roommaster.com/v1',
      description: 'Production server'
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
  definition: swaggerDefinition,
  apis: ['./src/routes/v1/**/*.ts', './src/routes/v1/**/*.js', './build/routes/v1/**/*.js']
};

// Generate swagger spec
const swaggerSpec = swaggerJsdoc(options);

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write JSON format
const jsonPath = path.join(docsDir, 'swagger.json');
fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
console.log(`✓ Swagger JSON documentation generated at: ${jsonPath}`);

// Write YAML format
const yamlPath = path.join(docsDir, 'swagger.yml');
fs.writeFileSync(yamlPath, yaml.dump(swaggerSpec, { lineWidth: -1 }), 'utf-8');
console.log(`✓ Swagger YAML documentation generated at: ${yamlPath}`);

console.log('\nSwagger documentation generated successfully!');
