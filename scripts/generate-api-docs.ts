import axios, { AxiosError, AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import net from 'net';
import app from '../src/app';
import config from '../src/config/env';
import docsConfig from './api-docs-config';
import { generateHTML } from './generate-html-docs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Load swagger spec
const swaggerSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/docs/swaggerdoc.json'), 'utf-8')
);

// Store database IDs for dynamic routes
let dbIds: any = {};

interface RouteInfo {
  method: string;
  path: string;
  fullPath: string;
  authRequired: boolean;
  permissions?: string[];
}

interface EndpointDoc {
  method: string;
  path: string;
  authRequired: boolean;
  permissions?: string[];
  requestExample?: any;
  responseStatus?: number;
  responseBody?: any;
  errorExample?: any;
  description?: string;
  headers?: any;
}

interface ApiDocumentation {
  title: string;
  version: string;
  baseUrl: string;
  generatedAt: string;
  endpoints: { [category: string]: EndpointDoc[] };
}

/**
 * Extract path from Express layer
 */
function getPathFromLayer(layer: any): string {
  if (!layer.regexp) return '';

  // Get the regex source
  const source = layer.regexp.source || '';

  // Try to extract a simple path pattern
  // Match patterns like \/v1, \/auth, \/employees, etc.
  const matches = source.match(/\\\/([a-zA-Z0-9-]+)/g);

  if (matches && matches.length > 0) {
    // Convert \/word to /word
    return matches.map((m: string) => m.replace(/\\\//g, '/')).join('');
  }

  return '';
}

/**
 * Extract all routes from Express app
 */
function extractRoutes(stack: any[], basePath = ''): RouteInfo[] {
  const routes: RouteInfo[] = [];

  stack.forEach((layer) => {
    if (layer.route) {
      // Regular route
      const methods = Object.keys(layer.route.methods);
      methods.forEach((method) => {
        const fullPath = basePath + layer.route.path;
        const middlewares = layer.route.stack || [];

        // Check if auth middleware is present
        const hasAuth = middlewares.some(
          (mw: any) => mw.name === 'auth' || (mw.handle && mw.handle.name === 'auth')
        );

        routes.push({
          method: method.toUpperCase(),
          path: layer.route.path,
          fullPath,
          authRequired: hasAuth
        });
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Nested router
      const nestedPath = getPathFromLayer(layer);
      const cleanPath = basePath + nestedPath;
      routes.push(...extractRoutes(layer.handle.stack, cleanPath));
    }
  });

  return routes;
}

/**
 * Login and get authentication token
 */
async function getAuthToken(baseUrl: string): Promise<string | null> {
  try {
    const response = await axios.post(`${baseUrl}/v1/auth/login`, {
      email: docsConfig.auth.email,
      password: docsConfig.auth.password
    });

    if (response.data.tokens && response.data.tokens.access) {
      const token = response.data.tokens.access.token;
      console.log(`🔑 Token received: ${token.substring(0, 20)}...`);
      return token;
    }
  } catch (error) {
    console.log('\n❌ Authentication failed!');
    console.log(`   Tried: ${docsConfig.auth.email} / ${docsConfig.auth.password}`);
    console.log('\n💡 Make sure the database is seeded:');
    console.log('   npx prisma db seed\n');
    if (axios.isAxiosError(error) && error.response) {
      console.log(`   Error: ${error.response.data.message || error.message}\n`);
    }
  }
  return null;
}

/**
 * Get query parameters for GET requests from swagger spec
 */
function getQueryParameters(method: string, path: string): any {
  if (method !== 'GET') {
    return {};
  }

  // Try to get from swagger spec
  const cleanPath = path.replace('/v1', '');
  const pathSpec = swaggerSpec.paths?.[cleanPath];
  if (!pathSpec) return {};

  const methodSpec = pathSpec[method.toLowerCase()];
  if (!methodSpec?.parameters) return {};

  const queryParams: any = {};
  for (const param of methodSpec.parameters) {
    if (param.in === 'query') {
      const schema = param.schema;
      if (param.required) {
        if (param.name === 'q') {
          queryParams[param.name] = 'search';
        } else if (param.name === 'checkInDate') {
          queryParams[param.name] = new Date().toISOString().split('T')[0];
        } else if (param.name === 'checkOutDate') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          queryParams[param.name] = tomorrow.toISOString().split('T')[0];
        } else if (param.name === 'shiftId' && dbIds.shiftId) {
          queryParams[param.name] = dbIds.shiftId;
        } else if (schema?.example) {
          queryParams[param.name] = schema.example;
        } else if (schema?.type === 'integer' || schema?.type === 'number') {
          queryParams[param.name] = 1;
        } else if (schema?.type === 'string') {
          if (schema?.format === 'date') {
            queryParams[param.name] = new Date().toISOString().split('T')[0];
          } else {
            queryParams[param.name] = 'sample';
          }
        }
      }
    }
  }

  return queryParams;
}

/**
 * Get sample request body for a given endpoint from swagger spec
 */
function getSampleRequestBody(method: string, path: string): any {
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
    return undefined;
  }

  // First try to get from config
  const key = `${method} ${path}`;
  if (docsConfig.sampleData[key]) {
    return docsConfig.sampleData[key];
  }

  // Then try to get from swagger spec
  const cleanPath = path.replace('/v1', '');
  const pathSpec = swaggerSpec.paths?.[cleanPath];
  if (!pathSpec) {
    // console.log(`⚠️  No swagger spec found for path: ${cleanPath}`);
    return undefined;
  }

  const methodSpec = pathSpec[method.toLowerCase()];
  if (!methodSpec?.requestBody) {
    // console.log(`⚠️  No request body in swagger for: ${method} ${cleanPath}`);
    return undefined;
  }

  const content = methodSpec.requestBody.content?.['application/json'];
  if (!content?.schema) {
    // console.log(`⚠️  No schema in swagger for: ${method} ${cleanPath}`);
    return undefined;
  }

  // Generate sample data from schema
  const sample = generateSampleFromSchema(content.schema, dbIds);
  // console.log(`✓ Generated sample for ${method} ${cleanPath}:`, JSON.stringify(sample));
  return sample;
}

/**
 * Generate sample data from JSON schema
 */
function generateSampleFromSchema(schema: any, ids: any): any {
  if (schema.example) return schema.example;

  if (schema.type === 'object') {
    const result: any = {};
    const props = schema.properties || {};
    const required = schema.required || [];

    // Only include required fields for cleaner request bodies
    const fieldsToInclude = required.length > 0 ? required : Object.keys(props);

    for (const key of fieldsToInclude) {
      const propSchema: any = props[key];
      if (!propSchema) continue;

      // Use actual IDs for ID fields
      if (key === 'customerId' && ids.customerId) {
        result[key] = ids.customerId;
      } else if (key === 'employeeId' && ids.employeeId) {
        result[key] = ids.employeeId;
      } else if (key === 'roomId' && ids.roomId) {
        result[key] = ids.roomId;
      } else if (key === 'roomTypeId' && ids.roomTypeId) {
        result[key] = ids.roomTypeId;
      } else if (key === 'serviceId' && ids.serviceId) {
        result[key] = ids.serviceId;
      } else if (key === 'paymentMethodId' && ids.paymentMethodId) {
        result[key] = ids.paymentMethodId;
      } else if (key === 'tierId' && ids.customerTierId) {
        result[key] = ids.customerTierId;
      } else if (key === 'shiftId' && ids.shiftId) {
        result[key] = ids.shiftId;
      } else if (key === 'guestFolioId' && ids.folioId) {
        result[key] = ids.folioId;
      } else if (key === 'invoiceToCustomerId' && ids.customerId) {
        result[key] = ids.customerId;
      } else if (propSchema.example !== undefined) {
        result[key] = propSchema.example;
      } else if (propSchema.enum && propSchema.enum.length > 0) {
        result[key] = propSchema.enum[0];
      } else if (propSchema.type === 'string') {
        if (propSchema.format === 'email') result[key] = 'test@example.com';
        else if (propSchema.format === 'phone') result[key] = '+1234567890';
        else if (propSchema.format === 'date') result[key] = new Date().toISOString().split('T')[0];
        else if (propSchema.format === 'date-time') result[key] = new Date().toISOString();
        else result[key] = 'sample';
      } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
        result[key] = propSchema.minimum || 1;
      } else if (propSchema.type === 'boolean') {
        result[key] = true;
      } else if (propSchema.type === 'array') {
        if (propSchema.items) {
          result[key] = [generateSampleFromSchema(propSchema.items, ids)];
        } else {
          result[key] = [];
        }
      } else if (propSchema.type === 'object') {
        result[key] = generateSampleFromSchema(propSchema, ids);
      }
    }
    return result;
  }

  if (schema.type === 'array') {
    if (schema.items) {
      return [generateSampleFromSchema(schema.items, ids)];
    }
    return [];
  }

  return {};
}

/**
 * Make request to endpoint and record response
 */
async function testEndpoint(
  baseUrl: string,
  route: RouteInfo,
  authToken: string | null
): Promise<EndpointDoc> {
  const headers: any = {
    'Content-Type': 'application/json'
  };

  // Add auth token for endpoints that require it
  // Don't add token for public auth endpoints (login, register, etc.)
  const isPublicAuthEndpoint =
    route.fullPath.includes('/auth/login') ||
    route.fullPath.includes('/auth/register') ||
    route.fullPath.includes('/auth/forgot-password');

  if (authToken && !isPublicAuthEndpoint) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Replace path parameters with actual database IDs
  const testPath = route.fullPath
    .replace(':id', String(dbIds.customerId || 1))
    .replace(':employeeId', String(dbIds.employeeId || 1))
    .replace(':customerId', String(dbIds.customerId || 1))
    .replace(':roomId', String(dbIds.roomId || 1))
    .replace(':roomTypeId', String(dbIds.roomTypeId || 1))
    .replace(':reservationId', String(dbIds.reservationId || 1))
    .replace(':folioId', String(dbIds.folioId || 1))
    .replace(':invoiceId', String(dbIds.invoiceId || 1))
    .replace(':serviceId', String(dbIds.serviceId || 1))
    .replace(':methodId', String(dbIds.paymentMethodId || 1))
    .replace(':stayRecordId', String(dbIds.stayRecordId || 1))
    .replace(':stayDetailId', String(dbIds.stayDetailId || 1))
    .replace(':taskId', String(dbIds.taskId || 1))
    .replace(':shiftId', String(dbIds.shiftId || 1))
    .replace(':sessionId', String(dbIds.sessionId || 1))
    .replace(':tierId', String(dbIds.customerTierId || 1))
    .replace(':logId', String(dbIds.logId || 1))
    .replace(':transactionId', String(dbIds.transactionId || 1));

  // Get query parameters for GET requests
  const queryParams = getQueryParameters(route.method, route.fullPath);
  const queryString =
    Object.keys(queryParams).length > 0 ? '?' + new URLSearchParams(queryParams).toString() : '';

  const url = `${baseUrl}${testPath}${queryString}`;
  const requestBody = getSampleRequestBody(route.method, route.fullPath);

  const doc: EndpointDoc = {
    method: route.method,
    path: route.fullPath,
    authRequired: route.authRequired,
    headers: route.authRequired ? { Authorization: 'Bearer <token>' } : undefined,
    description: docsConfig.descriptions[`${route.method} ${route.fullPath}`]
  };

  try {
    let response: AxiosResponse;

    switch (route.method) {
      case 'GET':
        response = await axios.get(url, { headers, timeout: docsConfig.timeout });
        break;
      case 'POST':
        doc.requestExample = requestBody;
        response = await axios.post(url, requestBody, { headers, timeout: docsConfig.timeout });
        break;
      case 'PUT':
        doc.requestExample = requestBody;
        response = await axios.put(url, requestBody, { headers, timeout: docsConfig.timeout });
        break;
      case 'PATCH':
        doc.requestExample = requestBody;
        response = await axios.patch(url, requestBody, { headers, timeout: docsConfig.timeout });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers, timeout: docsConfig.timeout });
        break;
      default:
        throw new Error(`Unsupported method: ${route.method}`);
    }

    doc.responseStatus = response.status;
    doc.responseBody = response.data;

    // Log successful authenticated request (first time only)
    if (authToken && doc.responseStatus === 200 && route.fullPath !== '/v1/auth/login') {
      console.log(`✓ Authenticated request succeeded: ${route.method} ${route.fullPath}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      doc.responseStatus = axiosError.response?.status || 500;
      doc.errorExample = axiosError.response?.data || { message: axiosError.message };
    } else {
      doc.responseStatus = 500;
      doc.errorExample = { message: 'Unknown error' };
    }
  }

  return doc;
}

/**
 * Categorize endpoints
 */
function categorizeEndpoint(path: string): string {
  if (path.includes('/auth')) return 'Authentication';
  if (path.includes('/employees')) return 'Employees';
  if (path.includes('/rooms')) return 'Rooms';
  if (path.includes('/customers')) return 'Customers';
  if (path.includes('/reservations')) return 'Reservations';
  if (path.includes('/stay-records')) return 'Stay Records';
  if (path.includes('/folios')) return 'Folios';
  if (path.includes('/services')) return 'Services';
  if (path.includes('/housekeeping')) return 'Housekeeping';
  if (path.includes('/invoices')) return 'Invoices';
  if (path.includes('/inspections')) return 'Inspections';
  if (path.includes('/customer-tiers')) return 'Customer Tiers';
  if (path.includes('/shifts')) return 'Shifts';
  if (path.includes('/reports')) return 'Reports';
  if (path.includes('/nightly')) return 'Nightly Operations';
  return 'Other';
}

/**
 * Generate markdown documentation
 */
function generateMarkdown(docs: ApiDocumentation): string {
  let markdown = `# ${docs.title}\n\n`;
  markdown += `**Version:** ${docs.version}\n\n`;
  markdown += `**Base URL:** \`${docs.baseUrl}\`\n\n`;
  markdown += `**Generated:** ${docs.generatedAt}\n\n`;
  markdown += `---\n\n`;
  markdown += `## Table of Contents\n\n`;

  // Generate table of contents
  Object.keys(docs.endpoints)
    .sort()
    .forEach((category) => {
      markdown += `- [${category}](#${category.toLowerCase().replace(/\s+/g, '-')})\n`;
    });

  markdown += `\n---\n\n`;

  // Generate documentation for each category
  Object.keys(docs.endpoints)
    .sort()
    .forEach((category) => {
      markdown += `## ${category}\n\n`;

      docs.endpoints[category].forEach((endpoint) => {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;

        if (endpoint.description) {
          markdown += `${endpoint.description}\n\n`;
        }

        if (endpoint.authRequired) {
          markdown += `**🔒 Authentication Required**\n\n`;
        }

        if (endpoint.headers) {
          markdown += `**Headers:**\n\`\`\`json\n${JSON.stringify(
            endpoint.headers,
            null,
            2
          )}\n\`\`\`\n\n`;
        }

        if (endpoint.requestExample) {
          markdown += `**Request Body:**\n\`\`\`json\n${JSON.stringify(
            endpoint.requestExample,
            null,
            2
          )}\n\`\`\`\n\n`;
        }

        markdown += `**Response Status:** \`${endpoint.responseStatus}\`\n\n`;

        if (endpoint.responseBody) {
          markdown += `**Success Response:**\n\`\`\`json\n${JSON.stringify(
            endpoint.responseBody,
            null,
            2
          )}\n\`\`\`\n\n`;
        }

        if (endpoint.errorExample) {
          markdown += `**Error Response:**\n\`\`\`json\n${JSON.stringify(
            endpoint.errorExample,
            null,
            2
          )}\n\`\`\`\n\n`;
        }

        markdown += `---\n\n`;
      });
    });

  return markdown;
}

/**
 * Find an available port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

/**
 * Fetch database IDs for use in dynamic routes
 */
async function fetchDatabaseIds() {
  console.log('📊 Fetching database IDs...');

  try {
    const customer = await prisma.customer.findFirst();
    const employee = await prisma.employee.findFirst();
    const room = await prisma.room.findFirst();
    const roomType = await prisma.roomType.findFirst();
    const service = await prisma.service.findFirst();
    const paymentMethod = await prisma.paymentMethod.findFirst();
    const customerTier = await prisma.customerTier.findFirst();

    dbIds = {
      customerId: customer?.id || 1,
      employeeId: employee?.id || 1,
      roomId: room?.id || 1,
      roomTypeId: roomType?.id || 1,
      serviceId: service?.id || 1,
      paymentMethodId: paymentMethod?.id || 1,
      customerTierId: customerTier?.id || 1,
      // Use defaults for IDs that don't exist yet
      reservationId: 1,
      folioId: 1,
      invoiceId: 1,
      stayRecordId: 1,
      stayDetailId: 1,
      taskId: 1,
      shiftId: 1,
      sessionId: 1,
      logId: 1,
      transactionId: 1
    };

    console.log(`✅ Database IDs loaded\n`);
  } catch (error) {
    console.log('⚠️  Could not fetch database IDs, using defaults\n');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting API Documentation Generator...\n');

  // Fetch database IDs first
  await fetchDatabaseIds();

  // Find an available port
  const preferredPort = config.port || 3000;
  const PORT = await findAvailablePort(preferredPort);

  if (PORT !== preferredPort) {
    console.log(`⚠️  Port ${preferredPort} is in use, using port ${PORT} instead\n`);
  }

  const server = app.listen(PORT, () => {
    console.log(`✅ Server started on port ${PORT}\n`);
  });

  const baseUrl = `http://localhost:${PORT}`;

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    console.log('📋 Extracting routes...');
    const routes = extractRoutes(app._router.stack);

    // Filter only API routes (v1)
    const apiRoutes = routes.filter((r) => r.fullPath.startsWith('/v1'));
    console.log(`✅ Found ${apiRoutes.length} API endpoints\n`);

    // Separate login endpoint from other routes
    const loginRoute = apiRoutes.find(
      (r) => r.method === 'POST' && r.fullPath === '/v1/auth/login'
    );
    const otherRoutes = apiRoutes.filter(
      (r) => !(r.method === 'POST' && r.fullPath === '/v1/auth/login')
    );

    const documentation: ApiDocumentation = {
      title: 'Hotel Management System API Documentation',
      version: '1.0.0',
      baseUrl: baseUrl,
      generatedAt: new Date().toISOString(),
      endpoints: {}
    };

    let authToken: string | null = null;
    let completed = 0;

    // Test login endpoint first and use it for authentication
    if (loginRoute) {
      console.log('🔐 Testing login endpoint and authenticating...');
      const loginDoc = await testEndpoint(baseUrl, loginRoute, null);

      if (loginDoc.responseStatus === 200 && loginDoc.responseBody?.tokens?.access?.token) {
        authToken = loginDoc.responseBody.tokens.access.token;
        console.log(`✅ Authentication successful (token: ${authToken?.substring(0, 20)}...)\n`);
      } else {
        console.log('❌ Authentication failed!');
        console.log(`   Status: ${loginDoc.responseStatus}`);
        if (loginDoc.errorExample) {
          console.log(`   Error: ${JSON.stringify(loginDoc.errorExample)}`);
        }
        console.log('\n💡 Make sure the database is seeded: npx prisma db seed\n');
        console.log('⚠️  Continuing without authentication - protected endpoints will fail\n');
      }

      // Add login endpoint to documentation
      const category = categorizeEndpoint(loginRoute.fullPath);
      if (!documentation.endpoints[category]) {
        documentation.endpoints[category] = [];
      }
      documentation.endpoints[category].push(loginDoc);
      completed++;
    } else {
      console.log('⚠️  Login endpoint not found, attempting fallback authentication...');
      authToken = await getAuthToken(baseUrl);
      if (authToken) {
        console.log('✅ Fallback authentication successful\n');
      } else {
        console.log('❌ Fallback authentication failed\n');
      }
    }

    console.log('🧪 Testing remaining endpoints...\n');

    // Test all other endpoints with authentication
    for (const route of otherRoutes) {
      // Check if endpoint should be skipped
      const routeKey = `${route.method} ${route.fullPath}`;
      if (docsConfig.skipEndpoints.includes(routeKey)) {
        console.log(`⏭️  Skipping ${routeKey}`);
        completed++;
        continue;
      }

      process.stdout.write(`\rProgress: ${completed}/${apiRoutes.length} endpoints`);

      const endpointDoc = await testEndpoint(baseUrl, route, authToken);
      const category = categorizeEndpoint(route.fullPath);

      if (!documentation.endpoints[category]) {
        documentation.endpoints[category] = [];
      }

      documentation.endpoints[category].push(endpointDoc);
      completed++;

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, docsConfig.delayBetweenRequests));
    }

    console.log(`\n✅ Tested all ${apiRoutes.length} endpoints\n`);

    console.log('📝 Generating markdown documentation...');
    const markdown = generateMarkdown(documentation);

    const outputPath = path.join(process.cwd(), 'API_DOCUMENTATION.md');
    fs.writeFileSync(outputPath, markdown);
    console.log(`✅ Documentation written to ${outputPath}\n`);

    // Also save JSON version
    const jsonPath = path.join(process.cwd(), 'api-documentation.json');
    fs.writeFileSync(jsonPath, JSON.stringify(documentation, null, 2));
    console.log(`✅ JSON documentation written to ${jsonPath}\n`);

    // Generate HTML version
    console.log('🎨 Generating HTML documentation...');
    const html = generateHTML(documentation);
    const htmlPath = path.join(process.cwd(), 'API_DOCUMENTATION.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ HTML documentation written to ${htmlPath}\n`);

    console.log('🎉 API Documentation generation complete!');
    console.log('\nGenerated files:');
    console.log(`  - ${outputPath}`);
    console.log(`  - ${jsonPath}`);
    console.log(`  - ${htmlPath}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close server and database
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);
