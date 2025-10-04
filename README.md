# Legal AI - Intelligent Legal Assistant

An AI-powered legal document analysis and case management platform built with Next.js, OpenAI GPT-4, and modern web technologies.

## Features

### 🤖 AI Case Intake
- **Conversational Interface**: Chat with AI to gather case information
- **Document Upload**: Support for PDF, Word, and text documents
- **Voice Recording**: Record case details via voice (with transcription)
- **Real-time Streaming**: ChatGPT-style streaming responses with markdown formatting
- **Document Context**: AI understands and references uploaded documents

### 📊 AI Case Assistant
Complete 6-step workflow for comprehensive case analysis:

1. **Select Case**: Create and manage case details
2. **Choose Documents**: Upload and organize legal documents
3. **Analysis Type**: Choose between Quick or Comprehensive analysis
4. **Case Summary**: AI-generated analysis with:
   - Executive Summary
   - Parties Involved
   - Winning Probability
   - SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
   - Strategy Recommendations
   - Action Items
5. **Similar Cases**: AI-powered search for relevant Indian legal precedents
6. **AI Chat**: Interactive Q&A about your case with streaming responses

### 📁 Document Processing
- **PDF Parsing**: Extract text from PDF documents
- **Word Processing**: Support for .docx files
- **Text Extraction**: Automatic key information extraction:
  - Parties identification
  - Case types
  - Jurisdictions
  - Important dates
  - Monetary amounts
- **S3 Integration**: Secure document storage

### 🔐 Authentication & Security
- NextAuth.js authentication
- Role-based access control
- Secure API routes
- Protected document access

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Markdown** - Beautiful markdown rendering
- **Lucide Icons** - Modern icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **OpenAI GPT-4o-mini** - AI analysis and chat
- **Prisma ORM** - Database management
- **SQLite** - Development database
- **AWS S3** - Document storage

### AI & ML
- **OpenAI GPT-4o-mini** - Main AI model for analysis and chat
- **Streaming API** - Real-time response streaming
- **Context Management** - Document-aware conversations

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key
- AWS S3 credentials (optional, for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legalai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret

   # AWS S3 (Optional)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET_NAME=your_bucket_name
   AWS_S3_REGION=us-east-1

   # Database
   DATABASE_URL="file:./prisma/dev.db"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. Sign up for an account at `/auth/signup`
2. Sign in at `/auth/signin`
3. Navigate to **AI Case Intake** or **AI Case Assistant**
4. Upload documents and start using the AI features

## Project Structure

```
legalai/
├── app/                          # Next.js App Router
│   ├── ai-case-assistant/       # Case Assistant workflow
│   ├── ai-case-intake/          # Case intake chat interface
│   ├── api/                     # API routes
│   │   ├── analysis/           # Case analysis endpoint
│   │   ├── auth/               # Authentication endpoints
│   │   ├── case-analysis/      # Comprehensive analysis
│   │   ├── cases/              # Case management
│   │   ├── chat-test/          # Chat API with streaming
│   │   ├── documents/          # Document upload
│   │   ├── similar-cases/      # Indian case law search
│   │   └── voice/              # Voice transcription
│   ├── auth/                    # Auth pages
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout
├── components/                  # React components
│   ├── ai-case-intake/         # Case intake components
│   │   ├── CaseAnalysis.tsx   # Analysis display
│   │   ├── ChatInterface.tsx   # Chat UI
│   │   ├── DocumentChip.tsx    # Document display
│   │   ├── DocumentUpload.tsx  # Upload interface
│   │   ├── FormattedMessage.tsx# Markdown message renderer
│   │   ├── MessageBubble.tsx   # Chat bubble
│   │   └── VoiceRecorder.tsx   # Voice recording
│   ├── AuthGuard.tsx           # Route protection
│   ├── Dashboard.tsx           # Main dashboard
│   ├── SessionProvider.tsx     # NextAuth provider
│   └── Sidebar.tsx             # Navigation sidebar
├── lib/                        # Utility libraries
│   ├── aiAnalysis.ts          # AI analysis logic
│   ├── auth.ts                # Auth configuration
│   ├── documentProcessor.ts    # Document processing
│   ├── prisma.ts              # Prisma client
│   └── s3.ts                  # S3 operations
├── prisma/                     # Database schema
│   └── schema.prisma          # Prisma schema
├── public/                     # Static assets
├── .env.local                  # Environment variables (create this)
├── .gitignore                  # Git ignore rules
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## Key Features Explained

### Document Processing Flow
1. User uploads document (PDF/Word/Text)
2. Document is processed and text extracted
3. Key information is identified (parties, dates, amounts)
4. Document stored in S3 (optional)
5. Metadata saved to database
6. Document context available to AI for analysis

### AI Analysis Types

**Quick Analysis** (1-2 minutes)
- Case summary
- Party identification
- Key facts
- Basic risk assessment
- Immediate action items

**Comprehensive Analysis** (3-5 minutes)
- Executive summary
- Detailed parties information
- Winning probability calculation
- SWOT analysis
- Legal precedents research
- Strategy recommendations
- Comprehensive risk assessment
- Prioritized action items

### Indian Case Law Integration
The system uses AI to search and reference:
- Supreme Court of India precedents
- High Court judgments
- AIR (All India Reporter) citations
- SCC (Supreme Court Cases) format
- Contextually relevant case law

### Streaming Chat
- Real-time message streaming
- Markdown formatting
- Code blocks, lists, tables
- Document-aware responses
- Context from analysis and precedents

## API Endpoints

### Chat
- `POST /api/chat-test` - Streaming chat with document context

### Analysis
- `POST /api/case-analysis` - Generate case analysis
- `POST /api/similar-cases` - Find similar Indian cases

### Documents
- `POST /api/documents/upload` - Upload and process documents
- `POST /api/documents/upload-test` - Test endpoint for uploads

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | Yes |
| `NEXTAUTH_URL` | Base URL for NextAuth | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth JWT | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | No |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | No |
| `AWS_S3_REGION` | S3 region | No |
| `DATABASE_URL` | Database connection string | Yes |

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Database Migrations
```bash
npx prisma migrate dev
npx prisma studio  # View database
```

### Linting & Formatting
```bash
npm run lint
npm run format
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t legalai .
docker run -p 3000:3000 legalai
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT-4o-mini API
- Next.js team for the amazing framework
- Prisma for the excellent ORM
- All open-source contributors

## Support

For support, email support@legalai.com or open an issue on GitHub.

## Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Integration with court filing systems
- [ ] Automated document generation
- [ ] Calendar and deadline tracking
- [ ] Client portal

---

**Built with ❤️ for legal professionals worldwide**
