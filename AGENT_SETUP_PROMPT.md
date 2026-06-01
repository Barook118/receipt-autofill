# Receipt Auto-Fill App - Complete Setup & Testing Instructions

## Project Overview
This is an AI-powered receipt/invoice scanner app that extracts structured data using Groq AI, stores it in Convex database, and authenticates users via Clerk.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Authentication**: Clerk (Google OAuth + email/password)
- **Backend/Database**: Convex (serverless backend with real-time sync)
- **AI Extraction**: Groq API (Llama vision + text models)
- **Package Manager**: npm (NOT bun - use npm for all commands)

## Project Structure
```
receipt-autofill/
├── client/                          # Main application directory
│   ├── convex/                      # Backend functions
│   │   ├── schema.ts                # Database schema
│   │   ├── receipts.ts              # CRUD operations
│   │   ├── auth.config.ts           # Clerk integration
│   │   └── health.ts                # Health check endpoint
│   ├── src/                         # React frontend
│   │   ├── pages/                   # Login, SignUp, HomePage
│   │   ├── components/              # UI components
│   │   ├── hooks/                   # Custom React hooks
│   │   └── lib/                     # Utilities (groqService, validation)
│   ├── scripts/                     # Test scripts
│   │   ├── test-convex-endpoints.mjs
│   │   ├── test-groq-extract.mjs
│   │   └── e2e-smoke.mjs
│   ├── .env                         # Clerk + Groq keys (gitignored)
│   ├── .env.local                   # Convex URLs (auto-generated)
│   └── package.json
```

## Environment Configuration

### Credentials Provided

#### Clerk Authentication
- **Instance**: `[Your Clerk instance name]`
- **Instance ID**: `[Your Clerk instance ID]`
- **Publishable Key**: `[SET IN .env]`
- **JWT Issuer Domain**: `https://your-instance.clerk.accounts.dev`
- **JWKS Endpoint**: `https://your-instance.clerk.accounts.dev/.well-known/jwks.json`

#### Convex Backend
- **Deployment**: `[Created during setup]`
- **Team**: `[Your team name]`
- **Project**: `client`
- **Convex URL**: `[Auto-generated in .env.local]`
- **Convex Site URL**: `[Auto-generated in .env.local]`

#### Groq AI API
- **API Key**: `[SET IN .env.local - See .env.example]`
- **Vision Model**: `meta-llama/llama-4-scout-17b-16e-instruct`
- **Text Model**: `llama-3.3-70b-versatile`

### File: `client/.env`
```env
# Clerk auth — https://dashboard.clerk.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Groq AI (also in .env.local)
# VITE_GROQ_API_KEY=
# VITE_GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
# VITE_GROQ_TEXT_MODEL=llama-3.3-70b-versatile
```

### File: `client/.env.local`
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
VITE_GROQ_TEXT_MODEL=llama-3.3-70b-versatile

# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:your-deployment-name # team: your-team, project: client

VITE_CONVEX_URL=https://your-deployment.convex.cloud

VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
```

### Convex Environment Variable
```bash
CLERK_JWT_ISSUER_DOMAIN=https://your-instance.clerk.accounts.dev
```

## Setup Instructions

### 1. Navigate to Project Directory
```bash
cd receipt-autofill/client
```

### 2. Install Dependencies
```bash
# Remove old dependencies if they exist
rm -rf node_modules package-lock.json

# Install fresh dependencies
npm install
```

### 3. Verify Environment Files
Ensure both `.env` and `.env.local` files exist with the credentials above.

### 4. Verify Convex Configuration
```bash
# Check Convex login status
npx convex login status

# Verify Clerk JWT issuer is set
npx convex env get CLERK_JWT_ISSUER_DOMAIN
```

Expected output: `https://evolved-foal-77.clerk.accounts.dev`

### 5. Start Development Servers

**Option A: Two separate terminals (recommended)**
```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Vite frontend
npm run dev
```

**Option B: Single command (if working)**
```bash
npm start
```

Wait for:
- Convex: "✔ Convex functions ready!"
- Vite: "➜ Local: http://localhost:5173/"

## Testing Requirements

### Create a Comprehensive Test Script

Create a new test script at `client/scripts/comprehensive-test.mjs` that:

1. **Tests all Convex endpoints** (using `npx convex run`)
2. **Tests Groq AI extraction** (using the existing groqService)
3. **Tests data fetching and CRUD operations**
4. **Verifies user isolation and security**
5. **Checks error handling**
6. **Reports all results in a clear format**

### Test Cases to Include

#### 1. Health Check
- Test `health:health` endpoint
- Verify it returns `{ status: "ok" }`

#### 2. Authentication Tests
- Test unauthenticated access (should be blocked)
- Test with valid test identity
- Verify "You must be signed in" error for protected endpoints

#### 3. CRUD Operations (User A)
- **Create**: Test `receipts:create` with sample invoice
- **Read**: Test `receipts:list` returns created invoice
- **Update**: Test `receipts:update` modifies the invoice
- **Delete**: Test `receipts:remove` deletes the invoice
- Verify list is empty after deletion

#### 4. User Isolation (User B)
- Test User B cannot see User A's invoices
- Test User B cannot update User A's invoices
- Test User B cannot delete User A's invoices

#### 5. Groq AI Extraction
- Test with sample Excel file (`test-fixtures/sample-invoice.xlsx`)
- Test with sample image (if available)
- Verify JSON parsing and validation
- Check extracted fields (merchantName, invoiceNumber, lineItems, etc.)

#### 6. Data Validation
- Test with invalid data (missing required fields)
- Test with invalid date formats
- Test with negative amounts
- Verify Zod validation errors

#### 7. Edge Cases
- Test with empty line items
- Test with very large amounts
- Test with special characters in merchant names
- Test with multiple line items

### Sample Test Identities
```javascript
const USER_A = '{"subject":"test-user-a"}';
const USER_B = '{"subject":"test-user-b"}';
```

### Sample Receipt Data
```javascript
const sampleReceipt = {
  receipt: {
    merchantName: "Test Vendor Ltd",
    invoiceNumber: "TEST-001",
    billTo: "Test Customer",
    date: "2026-05-24",
    dueDate: "",
    paymentTerm: "COD",
    currency: "MYR",
    lineItems: [
      {
        lineNo: 1,
        description: "Test Item",
        qty: 2,
        uom: "ea",
        unitPrice: 50,
        discount: 0,
        netAmount: 100,
      },
    ],
    subtotal: 100,
    serviceTax: 0,
    rounding: 0,
    totalAmount: 100,
    notes: "Test invoice",
  },
};
```

## Expected Test Results

### All Tests Should Pass
- ✅ Health check returns OK
- ✅ Unauthenticated access is blocked
- ✅ Create receipt succeeds with valid data
- ✅ List returns user's receipts only
- ✅ Update modifies receipt correctly
- ✅ Delete removes receipt
- ✅ User isolation prevents cross-user access
- ✅ Groq extraction returns valid JSON
- ✅ Data validation catches invalid inputs

### Error Handling
If any test fails:
1. **Identify the error** (authentication, validation, network, etc.)
2. **Diagnose the root cause**
3. **Fix the issue** (update code, configuration, or environment)
4. **Re-run the test** to verify the fix
5. **Document the solution**

## Common Issues & Solutions

### Issue: "command not found: bun"
**Solution**: Use `npm` or `npx` instead of `bun` or `bunx`

### Issue: "Cannot find native binding" (rolldown)
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "You must be signed in"
**Solution**: Use `--identity` flag with test user JSON

### Issue: Convex functions not updating
**Solution**: Check that `npx convex dev` is running and shows "Convex functions ready!"

### Issue: Vite not starting
**Solution**: Check port 5173 is not in use, or kill existing process

### Issue: Groq API errors
**Solution**: Verify `VITE_GROQ_API_KEY` is set correctly in `.env.local`

## Deliverables

After running all tests, provide:

1. **Test Results Summary**
   - Total tests run
   - Tests passed
   - Tests failed
   - Execution time

2. **Detailed Test Report**
   - Each endpoint tested
   - Request/response examples
   - Any errors encountered
   - Solutions applied

3. **Error Log** (if any)
   - Error message
   - Stack trace
   - Root cause
   - Fix applied
   - Verification result

4. **Performance Metrics**
   - Response times for each endpoint
   - Groq extraction time
   - Database operation times

5. **Security Verification**
   - User isolation confirmed
   - Authentication working
   - Authorization checks passing

## Success Criteria

The setup is complete and successful when:
- ✅ All dependencies installed without errors
- ✅ Both Convex and Vite servers running
- ✅ All endpoint tests pass
- ✅ Groq AI extraction works
- ✅ User isolation verified
- ✅ No security vulnerabilities found
- ✅ App accessible at http://localhost:5173/
- ✅ Sign-in flow works (manual test)
- ✅ Receipt upload and save works (manual test)

## Additional Notes

- Use `npm` for all commands (NOT bun)
- Run all commands from `receipt-autofill/client/` directory
- Keep both Convex and Vite servers running during tests
- Check console output for any warnings or errors
- Verify `.env` and `.env.local` files are not committed to git
- Test with both test identities to verify user isolation

## Commands Reference

```bash
# Install dependencies
npm install

# Start Convex backend
npx convex dev

# Start Vite frontend
npm run dev

# Run all together (if working)
npm start

# Test Convex endpoints
npm run test:endpoints

# Test Groq extraction
npm run test:groq

# Test specific endpoint
npx convex run health:health
npx convex run receipts:list --identity '{"subject":"test-user-a"}'

# Check Convex environment
npx convex env get CLERK_JWT_ISSUER_DOMAIN

# Build for production
npm run build
```

---

**Your Task**: 
1. Create the comprehensive test script as described above
2. Run all tests and verify everything works
3. If any errors occur, diagnose and fix them
4. Provide a detailed report of all test results
5. List any issues found and how they were resolved
