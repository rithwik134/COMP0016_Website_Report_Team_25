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

export default function RequirementsPage() {
  return (
    <PageLayout title="Requirements">
      <div className="space-y-8">
        {/* Partner Introduction */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Introduction and Project Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Provide an introduction to your project partner and the background context that led to this project. 
              Explain the partner's organization, their domain, and the motivation behind initiating this project. 
              Discuss any challenges they currently face and how this project aims to address them.
            </p>
          </CardContent>
        </Card>

        {/* Project Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Project Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Define clear, measurable objectives for the project</li>
              <li>Align goals with partner needs and user requirements</li>
              <li>Establish success criteria and evaluation metrics</li>
              <li>Set realistic milestones and deliverables</li>
            </ul>
          </CardContent>
        </Card>

        {/* Requirement Gathering */}
        <Card>
          <CardHeader>
            <CardTitle>Requirement Gathering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Methods Used</h3>
              <p className="text-muted-foreground leading-relaxed">
                Describe the methods you used to collect requirements. This may include interviews with stakeholders, 
                surveys, focus groups, observation studies, or analysis of existing systems. Explain your approach and 
                why these methods were chosen.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Survey Design and Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you conducted surveys, describe their design, the questions asked, the target audience, and the 
                response rate. Explain how you analyzed the survey data and what insights you gained from it.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personas */}
        <Card>
          <CardHeader>
            <CardTitle>Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((persona) => (
                <div key={persona} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Persona {persona}</h3>
                      <p className="text-sm text-muted-foreground">User Type</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground"><strong className="text-foreground">Age:</strong> 25-35</p>
                    <p className="text-muted-foreground"><strong className="text-foreground">Role:</strong> Description of role</p>
                    <p className="text-muted-foreground"><strong className="text-foreground">Goals:</strong> Main objectives and needs</p>
                    <p className="text-muted-foreground"><strong className="text-foreground">Challenges:</strong> Pain points and frustrations</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Use case diagram placeholder</p>
            </div>
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-foreground">List of Use Cases</h3>
              <div className="space-y-4">
                {['User Registration', 'Data Entry', 'Report Generation'].map((useCase, idx) => (
                  <div key={idx} className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium text-foreground">{useCase}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Brief description of the use case, actors involved, and the main flow of actions.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MoSCoW Requirements - Functional */}
        <Card>
          <CardHeader>
            <CardTitle>MoSCoW Requirements - Functional</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><Badge className="bg-red-500">Must Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">F1</TableCell>
                  <TableCell>User Authentication</TableCell>
                  <TableCell className="text-muted-foreground">Users must be able to register and log in securely</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge className="bg-red-500">Must Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">F2</TableCell>
                  <TableCell>Data Management</TableCell>
                  <TableCell className="text-muted-foreground">System must allow CRUD operations on core data</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge className="bg-orange-500">Should Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">F3</TableCell>
                  <TableCell>Data Visualization</TableCell>
                  <TableCell className="text-muted-foreground">System should provide charts and graphs for data analysis</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge className="bg-yellow-600">Could Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">F4</TableCell>
                  <TableCell>Export Functionality</TableCell>
                  <TableCell className="text-muted-foreground">Users could export data in multiple formats</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MoSCoW Requirements - Non-Functional */}
        <Card>
          <CardHeader>
            <CardTitle>MoSCoW Requirements - Non-Functional</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Requirement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><Badge className="bg-red-500">Must Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">NF1</TableCell>
                  <TableCell>Security</TableCell>
                  <TableCell className="text-muted-foreground">System must encrypt sensitive data at rest and in transit</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge className="bg-red-500">Must Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">NF2</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell className="text-muted-foreground">Page load times must be under 3 seconds</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge className="bg-orange-500">Should Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">NF3</TableCell>
                  <TableCell>Usability</TableCell>
                  <TableCell className="text-muted-foreground">Interface should be accessible (WCAG 2.1 AA compliant)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge className="bg-yellow-600">Could Have</Badge></TableCell>
                  <TableCell className="font-mono text-sm">NF4</TableCell>
                  <TableCell>Scalability</TableCell>
                  <TableCell className="text-muted-foreground">System could handle 10,000+ concurrent users</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
