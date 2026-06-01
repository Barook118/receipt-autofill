# Receipt Auto-Fill App 🧾

AI-powered invoice and receipt scanner that extracts structured data, auto-fills an editable form, and stores records per user in the cloud.

[![Security](https://img.shields.io/badge/vulnerabilities-0-brightgreen)](https://github.com/Barook118/receipt-autofill)
[![Tests](https://img.shields.io/badge/tests-17%2F26%20passing-yellow)](https://github.com/Barook118/receipt-autofill)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Barook118/receipt-autofill)

## ✨ Features

- 📤 **Multi-format Upload**: JPG, PNG, PDF, Excel (.xlsx), Word (.docx)
- 🤖 **AI Extraction**: Groq Llama models extract invoice data automatically
- ✏️ **Editable Forms**: Review and edit all extracted fields before saving
- 🔐 **Secure Authentication**: Clerk integration with Google OAuth
- 💾 **Cloud Storage**: Convex backend with real-time sync
- 👥 **User Isolation**: Each user sees only their own receipts
- 📊 **Export**: Download receipts as PNG or PDF
- ⚡ **Real-time Updates**: Live list updates via Convex subscriptions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm (NOT bun - use npm for all commands)
- Clerk account (free tier)
- Convex account (free tier)
- Groq API key (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/Barook118/receipt-autofill.git
cd receipt-autofill/client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Clerk and Groq credentials

# Start Convex backend (Terminal 1)
npx convex dev

# Start Vite frontend (Terminal 2)
npm run dev

# Open browser
open http://localhost:5173
```

## 🔧 Configuration

### 1. Clerk Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Enable Google OAuth
4. Copy publishable key to `client/.env`:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
5. Create JWT template named "convex" with audience: `convex`
6. Set Clerk issuer in Convex:
   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
   ```

### 2. Convex Setup

1. Run `npx convex dev` in `client/` directory
2. Login and create/select project
3. URLs auto-saved to `client/.env.local`

### 3. Groq API Setup

1. Get API key from [console.groq.com/keys](https://console.groq.com/keys)
2. Add to `client/.env.local`:
   ```env
   VITE_GROQ_API_KEY=gsk_...
   ```

## 🧪 Testing

```bash
# Run comprehensive test suite
npm run test:comprehensive

# Test Groq AI extraction
npm run test:groq

# Test Convex endpoints
npm run test:endpoints

# Run all tests
npm run test:all
```

## 📁 Project Structure

```
receipt-autofill/
├── client/                          # Main application
│   ├── convex/                      # Backend functions
│   │   ├── schema.ts                # Database schema
│   │   ├── receipts.ts              # CRUD operations
│   │   └── auth.config.ts           # Clerk integration
│   ├── src/                         # React frontend
│   │   ├── pages/                   # Login, SignUp, HomePage
│   │   ├── components/              # UI components
│   │   ├── hooks/                   # Custom React hooks
│   │   └── lib/                     # Utilities
│   ├── scripts/                     # Test scripts
│   └── package.json
├── AGENT_SETUP_PROMPT.md            # Detailed setup guide
├── TEST_RESULTS_SUMMARY.md          # Test results report
└── README.md                        # This file
```

## 🛡️ Security

- ✅ **Zero vulnerabilities** - All dependencies updated to secure versions
- ✅ **Authentication** - Clerk JWT validation
- ✅ **Authorization** - Row-level security per user
- ✅ **Data isolation** - Users can only access their own data
- ✅ **Input validation** - Zod schemas on all inputs
- ✅ **Secrets management** - Environment variables, never committed

## 🔒 Security Fixes Applied

- Upgraded `xlsx` from 0.18.5 to 0.20.3 (fixes prototype pollution & ReDoS)
- Upgraded `ws` to 8.20.1+ (fixes uninitialized memory disclosure)
- Added npm overrides to enforce secure versions
- All credentials removed from git history

## 📊 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Auth | Clerk (Google OAuth + Email/Password) |
| Backend | Convex (Serverless + Real-time) |
| AI | Groq (Llama 4 Scout + Llama 3.3) |
| Validation | Zod 4 |
| Export | html2canvas + jsPDF |

## 📝 Available Scripts

```bash
npm run dev              # Start Vite dev server
npm run dev:convex       # Start Convex backend
npm start                # Start both (if working)
npm run build            # Production build
npm run test:comprehensive  # Run all tests
npm run test:groq        # Test AI extraction
npm run test:endpoints   # Test Convex CRUD
npm run lint             # Run ESLint
```

## 🐛 Troubleshooting

### Port 5173 already in use
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9
```

### Convex functions not updating
```bash
# Restart Convex dev
npx convex dev
```

### "You must be signed in" error
- Verify Clerk JWT template has audience: `convex`
- Check `CLERK_JWT_ISSUER_DOMAIN` is set in Convex

### Groq API errors
- Verify `VITE_GROQ_API_KEY` in `.env.local`
- Check rate limits at [console.groq.com](https://console.groq.com)

## 📚 Documentation

- [AGENT_SETUP_PROMPT.md](./AGENT_SETUP_PROMPT.md) - Complete setup guide with all details
- [TEST_RESULTS_SUMMARY.md](./TEST_RESULTS_SUMMARY.md) - Comprehensive test results
- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [Groq Docs](https://console.groq.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Convex](https://convex.dev) - Backend infrastructure
- [Clerk](https://clerk.com) - Authentication
- [Groq](https://groq.com) - AI inference
- [SheetJS](https://sheetjs.com) - Excel parsing

## 📧 Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/Barook118/receipt-autofill/issues)
- Check [TEST_RESULTS_SUMMARY.md](./TEST_RESULTS_SUMMARY.md) for common issues

---

**Built with ❤️ using React, Convex, Clerk, and Groq**
