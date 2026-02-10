import { PageLayout } from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function TestingPage() {
  return (
    <PageLayout title="Testing">
      <div className="space-y-8">
        {/* Testing Strategy */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Our testing strategy follows a comprehensive approach covering multiple testing levels to ensure 
              reliability, performance, and user satisfaction. We employ automated testing wherever possible 
              to catch issues early in the development cycle.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Unit Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Test individual functions and components in isolation
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Integration Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Verify that different modules work together correctly
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">End-to-End Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Test complete user workflows from start to finish
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">User Acceptance Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Validate with real users and stakeholders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Unit and Integration Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Testing Framework</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use Jest as our primary testing framework with React Testing Library for component testing.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>Jest</Badge>
                <Badge>React Testing Library</Badge>
                <Badge>Testing Library User Event</Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Test Coverage</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">85%</div>
                  <div className="text-sm text-muted-foreground mt-1">Statements</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">78%</div>
                  <div className="text-sm text-muted-foreground mt-1">Branches</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">82%</div>
                  <div className="text-sm text-muted-foreground mt-1">Functions</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">87%</div>
                  <div className="text-sm text-muted-foreground mt-1">Lines</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Example Test Cases</h3>
              <div className="bg-secondary rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/LoginForm'

describe('LoginForm', () => {
  it('should render login form fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should display error for invalid credentials', async () => {
    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'invalid@email.com' } 
    })
    fireEvent.submit(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compatibility Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Compatibility Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              The application was tested across multiple browsers and devices to ensure consistent functionality 
              and appearance.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Browser Testing</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Browser</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Chrome</TableCell>
                    <TableCell>120+</TableCell>
                    <TableCell><Badge className="bg-green-600">Passed</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Full compatibility</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Firefox</TableCell>
                    <TableCell>121+</TableCell>
                    <TableCell><Badge className="bg-green-600">Passed</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Full compatibility</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Safari</TableCell>
                    <TableCell>17+</TableCell>
                    <TableCell><Badge className="bg-green-600">Passed</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Minor CSS differences</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Edge</TableCell>
                    <TableCell>120+</TableCell>
                    <TableCell><Badge className="bg-green-600">Passed</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Full compatibility</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Device Testing</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Desktop</h4>
                  <p className="text-sm text-muted-foreground">Tested on 1920x1080 and 2560x1440</p>
                  <Badge className="bg-green-600 mt-2">Passed</Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Tablet</h4>
                  <p className="text-sm text-muted-foreground">iPad Air, Samsung Galaxy Tab</p>
                  <Badge className="bg-green-600 mt-2">Passed</Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Mobile</h4>
                  <p className="text-sm text-muted-foreground">iPhone 14, Samsung Galaxy S23</p>
                  <Badge className="bg-green-600 mt-2">Passed</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Performance testing was conducted using Lighthouse and custom load testing tools to ensure 
              the application meets performance requirements.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Lighthouse Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">95</div>
                  <div className="text-sm text-muted-foreground mt-1">Performance</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">100</div>
                  <div className="text-sm text-muted-foreground mt-1">Accessibility</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">98</div>
                  <div className="text-sm text-muted-foreground mt-1">Best Practices</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">100</div>
                  <div className="text-sm text-muted-foreground mt-1">SEO</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Load Testing Results</h3>
              <p className="text-muted-foreground leading-relaxed">
                The system was tested under various load conditions to verify it can handle expected 
                traffic volumes. Results show the application maintains sub-second response times 
                under normal load conditions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Acceptance Testing */}
        <Card>
          <CardHeader>
            <CardTitle>User Acceptance Testing (UAT)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Testing Approach</h3>
              <p className="text-muted-foreground leading-relaxed">
                UAT was conducted with 10 participants representing our target user base. Participants 
                were asked to complete specific tasks while we observed and collected feedback.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Test Scenarios</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Scenario 1: User Registration</h4>
                    <Badge className="bg-green-600">9/10 Completed</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Users should be able to create an account with valid credentials
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Scenario 2: Data Entry</h4>
                    <Badge className="bg-green-600">10/10 Completed</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Users should be able to input and save data through the main form
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Scenario 3: Data Visualization</h4>
                    <Badge className="bg-green-600">8/10 Completed</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Users should be able to view and interact with data charts
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Feedback Summary</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-green-600 pl-4">
                  <p className="text-sm text-foreground font-medium">Positive Feedback</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Clean and intuitive interface</li>
                    <li>• Fast loading times</li>
                    <li>• Easy navigation between pages</li>
                  </ul>
                </div>

                <div className="border-l-4 border-yellow-600 pl-4">
                  <p className="text-sm text-foreground font-medium">Areas for Improvement</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Need more detailed error messages</li>
                    <li>• Mobile navigation could be more prominent</li>
                    <li>• Add keyboard shortcuts for power users</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Partner Feedback</h3>
              <div className="bg-primary/10 border border-primary rounded-lg p-4">
                <p className="text-sm text-muted-foreground italic">
                  "The system meets our requirements and provides a solid foundation for future development. 
                  The user interface is clean and professional, and the performance is excellent. We appreciate 
                  the team's attention to accessibility and security."
                </p>
                <p className="text-sm text-foreground font-medium mt-2">- Project Partner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
