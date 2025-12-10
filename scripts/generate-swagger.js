#!/usr/bin/env node
/*
 * Generate swagger doc files (json & yml)
 * Usage: node scripts/generate-swagger.js
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const swaggerJsdoc = require('swagger-jsdoc');

function loadSwaggerDef() {
  const buildPath = path.resolve(__dirname, '../build/src/docs/swaggerDef');
  const srcPath = path.resolve(__dirname, '../src/docs/swaggerDef');
  try {
    const mod = require(buildPath);
    return mod && mod.default ? mod.default : mod;
  } catch (err) {
    // Try source TypeScript with ts-node/register
    try {
      require('ts-node/register');
      const mod = require(srcPath);
      return mod && mod.default ? mod.default : mod;
    } catch (err2) {
      // default fallback
      return {
        openapi: '3.0.0',
        info: {
          title: 'API',
          version: '1.0.0'
        }
      };
    }
  }
}

const swaggerDefinition = loadSwaggerDef();

const options = {
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'src/routes/v1/*.ts']
};

const specs = swaggerJsdoc(options);

// write JSON
const jsonTarget = path.resolve(process.cwd(), 'src/docs/swaggerdoc.json');
fs.writeFileSync(jsonTarget, JSON.stringify(specs, null, 2));
console.log('Swagger JSON written to', jsonTarget);

// write YAML
const ymlTarget = path.resolve(process.cwd(), 'src/docs/swaggerdoc.yml');
fs.writeFileSync(ymlTarget, yaml.dump(specs));
console.log('Swagger YAML written to', ymlTarget);

process.exit(0);
