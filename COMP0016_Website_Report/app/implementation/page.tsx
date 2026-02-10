import { PageLayout } from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImplementationPage() {
  return (
    <PageLayout title="Implementation">
      <div className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground leading-relaxed">
              This section describes the implementation details of key features in our system. For each feature, 
              we explain the technologies used, architectural decisions, and provide code examples to illustrate 
              the implementation approach.
            </p>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle>User Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              We implemented secure user authentication using NextAuth.js with JWT tokens. The system supports 
              email/password authentication with bcrypt password hashing and session management.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Technologies Used</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>NextAuth.js for authentication framework</li>
                <li>bcrypt for password hashing</li>
                <li>JWT for session tokens</li>
                <li>HTTP-only cookies for secure token storage</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Implementation Details</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Fetch user from database
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })
        
        // Verify password
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return { id: user.id, email: user.email }
        }
        return null
      }
    })
  ],
  session: { strategy: 'jwt' }
}`}</code>
                </pre>
              </div>
            </div>

            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
              <p className="text-muted-foreground">Authentication flow diagram</p>
            </div>
          </CardContent>
        </Card>

        {/* Database Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Database Connection and ORM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              We use Prisma as our ORM to interact with PostgreSQL database. Prisma provides type-safe 
              database queries and automatic migration management.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Technologies Used</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Prisma ORM for type-safe database access</li>
                <li>PostgreSQL as the database engine</li>
                <li>Prisma Migrate for schema migrations</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Code Example</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Usage in API route
export async function getUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  })
  return users
}`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Data Visualization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Interactive charts and graphs are implemented using Recharts library, providing responsive 
              and accessible data visualizations.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Technologies Used</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Recharts for React-based charting</li>
                <li>Custom chart components with shadcn/ui styling</li>
                <li>SVG rendering for scalable graphics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Implementation</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// components/analytics-chart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export function AnalyticsChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke="#3b82f6" />
    </LineChart>
  )
}`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>File Upload and Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              File uploads are handled using multipart form data with storage on Vercel Blob or AWS S3. 
              Files are validated for type and size before processing.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Technologies Used</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Vercel Blob for file storage</li>
                <li>FormData API for file uploads</li>
                <li>File validation middleware</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Code Example</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// app/api/upload/route.ts
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Validate file
  if (!file || file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'Invalid file' }, { status: 400 })
  }
  
  // Upload to blob storage
  const blob = await put(file.name, file, { access: 'public' })
  
  return Response.json({ url: blob.url })
}`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Real-time features are implemented using Server-Sent Events (SSE) or WebSockets to push 
              updates to connected clients without polling.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Technologies Used</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Server-Sent Events for one-way updates</li>
                <li>React hooks for state management</li>
                <li>Event emitters for pub/sub pattern</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* API Integration */}
        <Card>
          <CardHeader>
            <CardTitle>External API Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              We integrate with external APIs using fetch with proper error handling, rate limiting, 
              and caching strategies.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Implementation Approach</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// lib/api-client.ts
export async function fetchExternalData(endpoint: string) {
  try {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
      headers: {
        'Authorization': \`Bearer \${process.env.API_KEY}\`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      throw new Error(\`API error: \${response.status}\`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API fetch failed:', error)
    throw error
  }
}`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Management */}
        <Card>
          <CardHeader>
            <CardTitle>State Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Application state is managed using React hooks (useState, useContext) for local state 
              and SWR for server state management with automatic revalidation.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Technologies Used</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>React Context API for global state</li>
                <li>SWR for data fetching and caching</li>
                <li>Local storage for persistence</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card>
          <CardHeader>
            <CardTitle>Error Handling and Logging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Comprehensive error handling is implemented at all layers with user-friendly error messages 
              and detailed logging for debugging.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Error Handling Strategy</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Try-catch blocks for async operations</li>
                <li>Error boundaries for React components</li>
                <li>API error responses with status codes</li>
                <li>Toast notifications for user feedback</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
