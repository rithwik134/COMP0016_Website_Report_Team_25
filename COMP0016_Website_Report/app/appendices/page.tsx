import { PageLayout } from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AppendicesPage() {
  return (
    <PageLayout title="Appendices">
      <div className="space-y-8">
        {/* User Manual */}
        <Card>
          <CardHeader>
            <CardTitle>User Manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/10 border border-primary rounded-lg p-4">
              <p className="text-sm text-foreground mb-2">
                <strong>Live Application URL:</strong> 
                <a href="#" className="text-primary hover:underline ml-2">
                  https://your-project.vercel.app
                </a>
              </p>
              <div className="space-y-1 text-sm">
                <p><strong>Admin Account:</strong> admin@example.com / admin123</p>
                <p><strong>User Account:</strong> user@example.com / user123</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Creating an Account</strong>
                  <p className="ml-6 mt-1 text-sm">
                    Navigate to the registration page and fill in your details. You'll receive a confirmation 
                    email to verify your account.
                  </p>
                  <div className="ml-6 mt-2 aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                    <p className="text-muted-foreground text-sm">Screenshot: Registration page</p>
                  </div>
                </li>

                <li className="mt-4">
                  <strong className="text-foreground">Logging In</strong>
                  <p className="ml-6 mt-1 text-sm">
                    Use your email and password to log in. Check "Remember me" to stay logged in across sessions.
                  </p>
                  <div className="ml-6 mt-2 aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                    <p className="text-muted-foreground text-sm">Screenshot: Login page</p>
                  </div>
                </li>

                <li className="mt-4">
                  <strong className="text-foreground">Dashboard Overview</strong>
                  <p className="ml-6 mt-1 text-sm">
                    After logging in, you'll see the main dashboard with quick access to all features.
                  </p>
                  <div className="ml-6 mt-2 aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                    <p className="text-muted-foreground text-sm">Screenshot: Dashboard</p>
                  </div>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Key Features</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground mb-2">Data Entry</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click the "Add New" button to create a new entry. Fill in all required fields and click "Save".
                  </p>
                  <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                    <p className="text-muted-foreground text-sm">Screenshot: Data entry form</p>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground mb-2">Viewing Data</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use the data table to view, sort, and filter your entries. Click on any row to view details.
                  </p>
                  <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                    <p className="text-muted-foreground text-sm">Screenshot: Data table</p>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground mb-2">Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Access the Analytics page to view charts and insights about your data.
                  </p>
                  <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                    <p className="text-muted-foreground text-sm">Screenshot: Analytics page</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Troubleshooting</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-1">Can't log in?</h4>
                  <p className="text-sm text-muted-foreground">
                    Make sure your email and password are correct. Use the "Forgot Password" link if needed.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-1">Data not saving?</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your internet connection and ensure all required fields are filled in correctly.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-1">Charts not loading?</h4>
                  <p className="text-sm text-muted-foreground">
                    Try refreshing the page. If the issue persists, clear your browser cache.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Manual */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              This guide provides step-by-step instructions for deploying the application to a production 
              environment.
            </p>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Prerequisites</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Node.js 18+ installed</li>
                <li>PostgreSQL database (or compatible cloud database)</li>
                <li>Git for version control</li>
                <li>Vercel account (or alternative hosting platform)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Step 1: Clone the Repository</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`git clone https://github.com/your-username/your-project.git
cd your-project
npm install`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Step 2: Configure Environment Variables</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Create a <code className="bg-secondary px-1 py-0.5 rounded">.env</code> file in the root directory:
              </p>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"
API_KEY="your-api-key"`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Step 3: Database Setup</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# Run Prisma migrations
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed`}</code>
                </pre>
              </div>
              <div className="mt-3 aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                <p className="text-muted-foreground text-sm">Screenshot: Database migration output</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Step 4: Build the Application</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# Build for production
npm run build

# Test the production build locally
npm start`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Step 5: Deploy to Vercel</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                <li>Push your code to a Git repository (GitHub, GitLab, or Bitbucket)</li>
                <li>Log in to your Vercel account at vercel.com</li>
                <li>Click "New Project" and import your repository</li>
                <li>Configure environment variables in the Vercel dashboard</li>
                <li>Click "Deploy" and wait for the deployment to complete</li>
              </ol>
              <div className="mt-3 aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                <p className="text-muted-foreground text-sm">Screenshot: Vercel deployment dashboard</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Alternative: Deploy with Docker</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# Build Docker image
docker build -t your-project .

# Run container
docker run -p 3000:3000 --env-file .env your-project`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Post-Deployment Checklist</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Verify all environment variables are set correctly</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Test authentication flow</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Check database connections</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Verify SSL certificate is active</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Test on multiple browsers and devices</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Set up monitoring and error tracking</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Issues and Data Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">GDPR Compliance</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This project complies with the General Data Protection Regulation (GDPR) requirements for 
                handling personal data of European Union citizens.
              </p>
              
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground mb-1">Data Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    We collect only necessary personal information (email, name) for account creation and 
                    system functionality. Users are informed about data collection through our privacy policy.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground mb-1">Data Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    All personal data is stored securely in encrypted databases with access controls. 
                    Data is retained only for as long as necessary for the stated purposes.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground mb-1">User Rights</h4>
                  <p className="text-sm text-muted-foreground">
                    Users have the right to access, modify, and delete their personal data. The system 
                    provides interfaces for users to exercise these rights.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground mb-1">Data Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Passwords are hashed using bcrypt. All data transmission uses HTTPS encryption. 
                    Regular security audits are conducted.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Source Code License</h3>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong className="text-foreground">License:</strong> MIT License (Subject to partner approval)
                </p>
                <p className="text-sm text-muted-foreground">
                  This project is licensed under the MIT License, allowing free use, modification, and 
                  distribution with attribution. The specific license terms have been agreed upon with 
                  the project partner.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Third-party Services</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This project uses the following third-party services, each with their own privacy policies:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Vercel for hosting (Privacy Policy: vercel.com/legal/privacy-policy)</li>
                <li>PostgreSQL database service (depending on provider)</li>
                <li>Google Fonts for typography (Privacy Policy: policies.google.com/privacy)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Development Blog */}
        <Card>
          <CardHeader>
            <CardTitle>Development Blog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Our development blog documents the project journey, technical challenges, and solutions 
              discovered throughout the development process. Updated bi-weekly with insights and progress.
            </p>
            
            <div className="bg-primary/10 border border-primary rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Blog URL:</strong> 
                <a href="#" className="text-primary hover:underline ml-2">
                  https://your-blog-url.com
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                External link to WordPress, Medium, or other blogging platform
              </p>
            </div>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">Week 4: Initial Design Decisions</h4>
                  <Badge variant="secondary">Nov 2025</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Discussing our technology stack choices and early architecture decisions...
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">Week 8: Implementing Authentication</h4>
                  <Badge variant="secondary">Dec 2025</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Challenges and solutions in implementing secure user authentication...
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">Week 12: Performance Optimization</h4>
                  <Badge variant="secondary">Jan 2026</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Techniques used to improve application performance and load times...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Progress Videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Monthly video updates showcasing progress, demonstrations, and key milestones reached 
              throughout the project development.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">November 2025 - Project Kickoff</h4>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                  <p className="text-muted-foreground">Video placeholder - November update</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  OneDrive link: [Add your OneDrive video link here]
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">December 2025 - Core Features</h4>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                  <p className="text-muted-foreground">Video placeholder - December update</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  OneDrive link: [Add your OneDrive video link here]
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">January 2026 - Integration & Testing</h4>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                  <p className="text-muted-foreground">Video placeholder - January update</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  OneDrive link: [Add your OneDrive video link here]
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">February 2026 - Refinement</h4>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                  <p className="text-muted-foreground">Video placeholder - February update</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  OneDrive link: [Add your OneDrive video link here]
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
