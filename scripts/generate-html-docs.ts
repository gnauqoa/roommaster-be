import fs from 'fs';
import path from 'path';

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
 * Generate HTML documentation from JSON
 */
export function generateHTML(docs: ApiDocumentation): string {
  const categories = Object.keys(docs.endpoints).sort();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docs.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    header .meta {
      opacity: 0.9;
      font-size: 0.9em;
    }
    
    nav {
      background: white;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    nav h2 {
      margin-bottom: 15px;
      color: #667eea;
    }
    
    nav ul {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    
    nav a {
      color: #667eea;
      text-decoration: none;
      padding: 8px 12px;
      display: block;
      border-radius: 4px;
      transition: all 0.3s;
    }
    
    nav a:hover {
      background: #667eea;
      color: white;
    }
    
    .category {
      background: white;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .category-header {
      background: #667eea;
      color: white;
      padding: 20px;
      font-size: 1.8em;
    }
    
    .endpoint {
      padding: 30px;
      border-bottom: 1px solid #eee;
    }
    
    .endpoint:last-child {
      border-bottom: none;
    }
    
    .endpoint-title {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .method {
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.85em;
      text-transform: uppercase;
    }
    
    .method.get { background: #61affe; color: white; }
    .method.post { background: #49cc90; color: white; }
    .method.put { background: #fca130; color: white; }
    .method.patch { background: #50e3c2; color: white; }
    .method.delete { background: #f93e3e; color: white; }
    
    .path {
      font-family: 'Courier New', monospace;
      font-size: 1.2em;
      color: #333;
    }
    
    .auth-badge {
      background: #ff6b6b;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.8em;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    
    .description {
      color: #666;
      margin-bottom: 20px;
      font-style: italic;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section h4 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.9em;
    }
    
    .response-status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
    }
    
    .response-status.success {
      background: #d4edda;
      color: #155724;
    }
    
    .response-status.error {
      background: #f8d7da;
      color: #721c24;
    }
    
    .search-box {
      width: 100%;
      padding: 12px;
      border: 2px solid #667eea;
      border-radius: 4px;
      font-size: 1em;
      margin-bottom: 20px;
    }
    
    footer {
      text-align: center;
      padding: 20px;
      color: #666;
      margin-top: 40px;
    }
    
    @media (max-width: 768px) {
      header h1 {
        font-size: 1.8em;
      }
      
      nav ul {
        grid-template-columns: 1fr;
      }
      
      .endpoint-title {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${docs.title}</h1>
      <div class="meta">
        <p><strong>Version:</strong> ${docs.version}</p>
        <p><strong>Base URL:</strong> <code>${docs.baseUrl}</code></p>
        <p><strong>Generated:</strong> ${new Date(docs.generatedAt).toLocaleString()}</p>
      </div>
    </header>
    
    <nav>
      <h2>📑 Categories</h2>
      <input type="text" id="searchBox" class="search-box" placeholder="Search endpoints...">
      <ul>
        ${categories
          .map(
            (cat) => `
          <li><a href="#${cat.toLowerCase().replace(/\s+/g, '-')}">${cat} (${
              docs.endpoints[cat].length
            })</a></li>
        `
          )
          .join('')}
      </ul>
    </nav>
    
    ${categories
      .map(
        (category) => `
      <div class="category" id="${category.toLowerCase().replace(/\s+/g, '-')}">
        <div class="category-header">${category}</div>
        ${docs.endpoints[category]
          .map(
            (endpoint) => `
          <div class="endpoint" data-search="${endpoint.method} ${endpoint.path} ${
              endpoint.description || ''
            }">
            <div class="endpoint-title">
              <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
              <span class="path">${endpoint.path}</span>
              ${endpoint.authRequired ? '<span class="auth-badge">🔒 Auth Required</span>' : ''}
            </div>
            
            ${endpoint.description ? `<p class="description">${endpoint.description}</p>` : ''}
            
            ${
              endpoint.headers
                ? `
              <div class="section">
                <h4>Headers</h4>
                <pre>${JSON.stringify(endpoint.headers, null, 2)}</pre>
              </div>
            `
                : ''
            }
            
            ${
              endpoint.requestExample
                ? `
              <div class="section">
                <h4>Request Body</h4>
                <pre>${JSON.stringify(endpoint.requestExample, null, 2)}</pre>
              </div>
            `
                : ''
            }
            
            <div class="section">
              <h4>Response</h4>
              <p>
                <span class="response-status ${
                  endpoint.responseStatus && endpoint.responseStatus < 400 ? 'success' : 'error'
                }">
                  ${endpoint.responseStatus || 'N/A'}
                </span>
              </p>
              ${
                endpoint.responseBody
                  ? `
                <pre>${JSON.stringify(endpoint.responseBody, null, 2)}</pre>
              `
                  : ''
              }
            </div>
            
            ${
              endpoint.errorExample
                ? `
              <div class="section">
                <h4>Error Response</h4>
                <pre>${JSON.stringify(endpoint.errorExample, null, 2)}</pre>
              </div>
            `
                : ''
            }
          </div>
        `
          )
          .join('')}
      </div>
    `
      )
      .join('')}
    
    <footer>
      <p>Generated by API Documentation Generator</p>
    </footer>
  </div>
  
  <script>
    // Search functionality
    const searchBox = document.getElementById('searchBox');
    const endpoints = document.querySelectorAll('.endpoint');
    
    searchBox.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      
      endpoints.forEach(endpoint => {
        const searchText = endpoint.getAttribute('data-search').toLowerCase();
        if (searchText.includes(query)) {
          endpoint.style.display = 'block';
        } else {
          endpoint.style.display = 'none';
        }
      });
      
      // Hide empty categories
      document.querySelectorAll('.category').forEach(category => {
        const visibleEndpoints = Array.from(category.querySelectorAll('.endpoint'))
          .filter(ep => ep.style.display !== 'none');
        category.style.display = visibleEndpoints.length > 0 ? 'block' : 'none';
      });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Generate HTML documentation from JSON file
 */
export function generateHTMLFromFile(jsonPath: string, outputPath: string) {
  const docs: ApiDocumentation = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const html = generateHTML(docs);
  fs.writeFileSync(outputPath, html);
  console.log(`✅ HTML documentation written to ${outputPath}`);
}

// If run directly
if (require.main === module) {
  const jsonPath = path.join(process.cwd(), 'api-documentation.json');
  const htmlPath = path.join(process.cwd(), 'API_DOCUMENTATION.html');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ api-documentation.json not found. Run generate-api-docs.ts first.');
    process.exit(1);
  }

  generateHTMLFromFile(jsonPath, htmlPath);
}
