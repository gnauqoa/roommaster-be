// CommonJS config for swagger-jsdoc CLI
// This file requires the built swaggerDef (CommonJS) if available, otherwise falls back
// to loading TypeScript source using ts-node/register.
const path = require('path');
let swaggerDefinition;
try {
  // Try compiled build first
  swaggerDefinition = require(path.resolve(__dirname, '../../build/src/docs/swaggerDef')).default || require(path.resolve(__dirname, '../../build/src/docs/swaggerDef'));
} catch (err) {
  // Fallback to TypeScript source via ts-node (assumes ts-node is installed)
  try {
    require('ts-node/register');
    swaggerDefinition = require(path.resolve(__dirname, './swaggerDef')).default || require(path.resolve(__dirname, './swaggerDef'));
  } catch (err2) {
    // Last resort: minimal static definition
    swaggerDefinition = {
      openapi: '3.0.0',
      info: {
        title: 'API',
        version: '1.0.0'
      }
    };
  }
}

module.exports = {
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'src/routes/v1/*.ts']
};
