import { PageLayout } from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SystemDesignPage() {
  return (
    <PageLayout title="System Design">
      <div className="space-y-8">
        {/* System Architecture */}
        <Card>
          <CardHeader>
            <CardTitle>System Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Our system follows a modern three-tier architecture with clear separation of concerns between 
              the presentation layer, application logic, and data storage.
            </p>
            
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
              <p className="text-muted-foreground">System architecture diagram placeholder</p>
            </div>

            <div className="space-y-4 mt-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground">Frontend Layer</h3>
                <p className="text-sm text-muted-foreground">
                  React-based single-page application with Next.js for server-side rendering and routing. 
                  Handles user interactions, data presentation, and client-side state management.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground">Backend Layer</h3>
                <p className="text-sm text-muted-foreground">
                  RESTful API built with Next.js API routes, handling business logic, authentication, 
                  authorization, and data validation.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground">Database Layer</h3>
                <p className="text-sm text-muted-foreground">
                  PostgreSQL database for persistent data storage with Prisma ORM for type-safe database queries.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground">External Services</h3>
                <p className="text-sm text-muted-foreground">
                  Integration with third-party APIs for additional functionality such as authentication, 
                  payment processing, and cloud storage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Site Map */}
        <Card>
          <CardHeader>
            <CardTitle>Site Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Visual representation of the website structure showing the relationship between different pages 
              and navigation flows.
            </p>
            
            <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border">
              <p className="text-muted-foreground">Site map diagram placeholder</p>
            </div>
          </CardContent>
        </Card>

        {/* Sequence Diagrams */}
        <Card>
          <CardHeader>
            <CardTitle>Sequence Diagrams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Sequence diagrams illustrating key interactions and data flows within the system.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">User Authentication Flow</h3>
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                <p className="text-muted-foreground">Authentication sequence diagram placeholder</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Data Processing Flow</h3>
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                <p className="text-muted-foreground">Data processing sequence diagram placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Design Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed mb-4">
              We employ several established design patterns to ensure code maintainability, scalability, 
              and reusability.
            </p>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Component Pattern</h3>
                <p className="text-sm text-muted-foreground">
                  React components following the composition pattern for reusable and modular UI elements.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Repository Pattern</h3>
                <p className="text-sm text-muted-foreground">
                  Abstraction layer between business logic and data access, providing a clean API for data operations.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Middleware Pattern</h3>
                <p className="text-sm text-muted-foreground">
                  Request processing pipeline for authentication, logging, and error handling in API routes.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Observer Pattern</h3>
                <p className="text-sm text-muted-foreground">
                  State management using React hooks and context for reactive data updates across components.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Diagrams */}
        <Card>
          <CardHeader>
            <CardTitle>Class Diagrams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              UML class diagrams showing the main entities, their attributes, methods, and relationships.
            </p>
            
            <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border">
              <p className="text-muted-foreground">Class diagram placeholder</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card>
          <CardHeader>
            <CardTitle>Data Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Our database schema is designed to efficiently store and retrieve data while maintaining 
              referential integrity and supporting complex queries.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Entity-Relationship Diagram</h3>
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                <p className="text-muted-foreground">ER diagram placeholder</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Add your database ER diagram showing tables, columns, data types, and relationships
              </p>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-foreground mb-3">Key Tables</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">users</h4>
                  <p className="text-sm text-muted-foreground mb-2">Stores user account information and authentication credentials</p>
                  <div className="text-xs font-mono text-muted-foreground">
                    id, email, password_hash, name, created_at, updated_at
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">projects</h4>
                  <p className="text-sm text-muted-foreground mb-2">Stores project data and metadata</p>
                  <div className="text-xs font-mono text-muted-foreground">
                    id, user_id, title, description, status, created_at, updated_at
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">data_entries</h4>
                  <p className="text-sm text-muted-foreground mb-2">Stores main application data entries</p>
                  <div className="text-xs font-mono text-muted-foreground">
                    id, project_id, content, metadata, created_at, updated_at
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* APIs */}
        <Card>
          <CardHeader>
            <CardTitle>APIs and Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              RESTful API endpoints following standard conventions for resource manipulation.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <span className="px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded">GET</span>
                <code className="text-sm font-mono">/api/users</code>
                <span className="text-sm text-muted-foreground">Retrieve all users</span>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded">POST</span>
                <code className="text-sm font-mono">/api/users</code>
                <span className="text-sm text-muted-foreground">Create new user</span>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded">PUT</span>
                <code className="text-sm font-mono">/api/users/:id</code>
                <span className="text-sm text-muted-foreground">Update user</span>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <span className="px-2 py-1 bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-semibold rounded">DELETE</span>
                <code className="text-sm font-mono">/api/users/:id</code>
                <span className="text-sm text-muted-foreground">Delete user</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
