#!/usr/bin/env node
/**
 * Script to automatically refactor route files to factory pattern
 * Wraps router creation in exported factory function
 */

const fs = require('fs');
const path = require('path');

const routeFiles = [
  // Employee routes
  'src/routes/v1/employee/booking.route.ts',
  'src/routes/v1/employee/transaction.route.ts',
  'src/routes/v1/employee/service.route.ts',
  'src/routes/v1/employee/usage-service.route.ts',
  'src/routes/v1/employee/room.route.ts',
  'src/routes/v1/employee/roomType.route.ts',
  'src/routes/v1/employee/roomTag.route.ts',
  'src/routes/v1/employee/promotion.route.ts',
  'src/routes/v1/employee/activity.route.ts',
  'src/routes/v1/employee/customerManagement.route.ts',
  'src/routes/v1/employee/employeeManagement.route.ts',
  'src/routes/v1/employee/transaction-details.route.ts',
  'src/routes/v1/employee/app-setting.route.ts',
  // Customer routes
  'src/routes/v1/customer/auth.route.ts',
  'src/routes/v1/customer/profile.route.ts',
  'src/routes/v1/customer/booking.route.ts',
  'src/routes/v1/customer/room.route.ts',
  'src/routes/v1/customer/promotion.route.ts',
  'src/routes/v1/customer/usage-service.route.ts'
];

function refactorRouteFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if already refactored
  if (content.includes('export default function create')) {
    console.log(`✓ Already refactored: ${filePath}`);
    return true;
  }

  // Extract function name from file path
  const fileName = path.basename(filePath, '.route.ts');
  const functionName = `create${
    fileName.charAt(0).toUpperCase() +
    fileName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  }Routes`;

  // Find where router is created
  const routerMatch = content.match(/const router = express\.Router\(\);/);
  if (!routerMatch) {
    console.log(`⚠️  No router found in: ${filePath}`);
    return false;
  }

  // Find the export statement
  const exportMatch = content.match(/export default router;/);
  if (!exportMatch) {
    console.log(`⚠️  No export found in: ${filePath}`);
    return false;
  }

  // Split content at router creation
  const beforeRouter = content.substring(0, routerMatch.index);
  const afterRouter = content.substring(routerMatch.index + routerMatch[0].length);

  // Remove the export default router; line
  const withoutExport = afterRouter.replace(/\nexport default router;\s*$/, '');

  // Build new content
  const newContent = `${beforeRouter}
export default function ${functionName}(): express.Router {
  const router = express.Router();
${withoutExport}
  return router;
}
`;

  // Write back
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`✓ Refactored: ${filePath}`);
  return true;
}

console.log('🔧 Starting route refactoring...\n');

let success = 0;
let failed = 0;

routeFiles.forEach((file) => {
  if (refactorRouteFile(file)) {
    success++;
  } else {
    failed++;
  }
});

console.log(`\n✅ Refactored ${success} files`);
if (failed > 0) {
  console.log(`❌ Failed ${failed} files`);
}
