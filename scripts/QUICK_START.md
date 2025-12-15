# Quick Start Guide: API Documentation Generator

## 🚀 Generate API Documentation in 3 Steps

### Step 1: Prepare Your Environment

```bash
# Start the database
pnpm run docker:dev-db:start

# Setup database schema
npx prisma db push

# Seed with test data (includes admin user)
npx prisma db seed
```

### Step 2: Run the Generator

```bash
# Generate complete API documentation
pnpm run generate:api-docs
```

This will create:

- ✅ `API_DOCUMENTATION.md` - Markdown format
- ✅ `api-documentation.json` - JSON format
- ✅ `API_DOCUMENTATION.html` - Interactive HTML

### Step 3: View Your Documentation

**Markdown:**

```bash
# Open in VS Code
code API_DOCUMENTATION.md
```

**HTML (Interactive):**

```bash
# Open in browser (Windows)
start API_DOCUMENTATION.html

# Or manually open the file in your browser
```

---

## 📖 What You Get

### Markdown Documentation

- Complete API reference
- Request/response examples
- Authentication requirements
- Organized by category

### JSON Documentation

- Machine-readable format
- Perfect for automation
- API testing integration

### HTML Documentation

- Beautiful, interactive UI
- Search functionality
- Color-coded methods
- Copy-paste examples

---

## ⚙️ Customize (Optional)

Edit `scripts/api-docs-config.ts` to customize:

```typescript
// Change authentication
auth: {
  email: 'your@email.com',
  password: 'yourpassword'
}

// Add sample data for your endpoints
sampleData: {
  'POST /v1/your-endpoint': {
    field: 'value'
  }
}

// Add descriptions
descriptions: {
  'GET /v1/your-endpoint': 'Your custom description'
}
```

---

## 🔧 Troubleshooting

### "Cannot authenticate"

✅ Run: `npx prisma db seed` to create admin user

### "Connection refused"

✅ Run: `pnpm run docker:dev-db:start`

### "Endpoint returns 404"

✅ Check that your routes are properly configured

---

## 📝 Common Use Cases

### Only generate HTML from existing JSON

```bash
pnpm run generate:html-docs
```

### Re-run after API changes

```bash
pnpm run generate:api-docs
```

### Add to Git

```bash
git add API_DOCUMENTATION.md api-documentation.json
git commit -m "Update API documentation"
```

---

## 🎯 Tips

1. **Run regularly** - Generate after each API change
2. **Review output** - Check examples make sense
3. **Share HTML** - Easy for non-technical stakeholders
4. **Version control** - Track API evolution over time
5. **CI/CD integration** - Automate in your pipeline

---

## Need Help?

See the full [API_DOCS_GENERATOR_README.md](./API_DOCS_GENERATOR_README.md) for:

- Detailed configuration options
- Advanced usage
- CI/CD integration
- Troubleshooting guide

---

**That's it! You now have comprehensive API documentation. 🎉**
