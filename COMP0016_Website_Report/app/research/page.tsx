import { PageLayout } from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ResearchPage() {
  return (
    <PageLayout title="Research">
      <div className="space-y-8">
        {/* Related Projects Review */}
        <Card>
          <CardHeader>
            <CardTitle>Related Projects Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-l-4 border-primary pl-6 space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Project Name 1</h3>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Main Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Feature description and implementation details</li>
                  <li>User interface and interaction patterns</li>
                  <li>Technology stack and architecture choices</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Key Learnings:</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Discuss what you learned from analyzing this project, including best practices, 
                  potential pitfalls, and ideas you can apply to your own implementation.
                </p>
              </div>
            </div>

            <div className="border-l-4 border-primary pl-6 space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Project Name 2</h3>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Main Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Feature description and implementation details</li>
                  <li>User interface and interaction patterns</li>
                  <li>Technology stack and architecture choices</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Key Learnings:</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Discuss what you learned from analyzing this project, including best practices, 
                  potential pitfalls, and ideas you can apply to your own implementation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Review */}
        <Card>
          <CardHeader>
            <CardTitle>Technology Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Programming Languages & Frameworks */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Programming Languages & Frameworks</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Option 1: React + Next.js</h4>
                    <Badge className="bg-green-600">Selected</Badge>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Server-side rendering and static generation</li>
                    <li>✓ Excellent performance and SEO</li>
                    <li>✓ Large community and ecosystem</li>
                    <li>✓ Built-in routing and API routes</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Option 2: Vue + Nuxt</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Gentle learning curve</li>
                    <li>✓ Good documentation</li>
                    <li>✗ Smaller ecosystem than React</li>
                    <li>✗ Fewer job opportunities</li>
                  </ul>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                <strong className="text-foreground">Decision:</strong> We chose React with Next.js because of its robust ecosystem, 
                excellent performance characteristics, and strong industry adoption. The framework's built-in features 
                for SSR and static generation align well with our project requirements.
              </p>
            </div>

            {/* Database Solutions */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Database Solutions</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Option 1: PostgreSQL</h4>
                    <Badge className="bg-green-600">Selected</Badge>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ ACID compliance and reliability</li>
                    <li>✓ Advanced querying capabilities</li>
                    <li>✓ JSON support for flexible schemas</li>
                    <li>✓ Strong community support</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Option 2: MongoDB</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Flexible schema design</li>
                    <li>✓ Good for unstructured data</li>
                    <li>✗ Limited transaction support</li>
                    <li>✗ More complex for relational data</li>
                  </ul>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                <strong className="text-foreground">Decision:</strong> PostgreSQL was selected for its robustness, ACID compliance, 
                and excellent support for complex queries. Our data model benefits from relational structure, making 
                PostgreSQL the optimal choice.
              </p>
            </div>

            {/* APIs and Libraries */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">APIs and Libraries</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-medium text-foreground">Chart.js / Recharts</h4>
                  <p className="text-sm text-muted-foreground">
                    Selected for data visualization due to its React integration and declarative API.
                  </p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-medium text-foreground">Tailwind CSS</h4>
                  <p className="text-sm text-muted-foreground">
                    Chosen for rapid UI development with utility-first approach and excellent customization.
                  </p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-medium text-foreground">NextAuth.js</h4>
                  <p className="text-sm text-muted-foreground">
                    Selected for authentication with built-in OAuth providers and session management.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Decisions Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary of Technical Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Frontend</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>React</Badge>
                    <Badge>Next.js</Badge>
                    <Badge>Tailwind CSS</Badge>
                    <Badge>TypeScript</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Backend</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Next.js API Routes</Badge>
                    <Badge>PostgreSQL</Badge>
                    <Badge>Prisma ORM</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Authentication</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>NextAuth.js</Badge>
                    <Badge>JWT</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Deployment</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Vercel</Badge>
                    <Badge>Docker</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* References */}
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                Author Name, "Article Title," <em>Publication Name</em>, vol. X, no. Y, pp. ZZ-ZZ, Month Year.
              </li>
              <li>
                Author Name, "Book Title," Publisher, City, Year.
              </li>
              <li>
                Author Name, "Website Title," Organization. [Online]. Available: https://example.com. [Accessed: Date].
              </li>
            </ol>
            <p className="text-sm text-muted-foreground mt-4 italic">
              Note: References should follow IEEE citation style
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
