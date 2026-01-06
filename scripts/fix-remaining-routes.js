#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'src/routes/v1/employee/room.route.ts',
  'src/routes/v1/employee/roomType.route.ts',
  'src/routes/v1/employee/customerManagement.route.ts',
  'src/routes/v1/employee/employeeManagement.route.ts'
];

files.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Match pattern: const xxxRoute = express.Router();
  const match = content.match(/const (\w+Route) = express\.Router\(\);/);
  if (!match) {
    console.log(`⚠️  No route found in: ${file}`);
    return;
  }

  const routeVarName = match[1];
  const functionName = `create${file
    .split('/')
    .pop()
    .replace('.route.ts', '')
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^(.)/, (g) => g.toUpperCase())}Routes`;

  // Find where to insert function start
  const beforeRouter = content.substring(0, match.index);
  const afterRouter = content.substring(match.index + match[0].length);

  // Remove export default xxxRoute;
  const withoutExport = afterRouter.replace(
    new RegExp(`\\nexport default ${routeVarName};\\s*$`),
    ''
  );

  // Build new content
  const newContent = `${beforeRouter}
export default function ${functionName}(): express.Router {
  const ${routeVarName} = express.Router();
${withoutExport}
  return ${routeVarName};
}
`;

  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`✓ Refactored: ${file}`);
});
