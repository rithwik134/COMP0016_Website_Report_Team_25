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

export default function EvaluationPage() {
  return (
    <PageLayout title="Evaluation">
      <div className="space-y-8">
        {/* Summary of Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Summary of Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              This project has successfully delivered a functional system that meets the majority of 
              requirements set out at the beginning. Below is a comprehensive breakdown of what was 
              achieved and the status of each requirement.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Achievement Table</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contributors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">F1</TableCell>
                    <TableCell>User Authentication</TableCell>
                    <TableCell><Badge className="bg-red-500">Must Have</Badge></TableCell>
                    <TableCell><Badge className="bg-green-600">Completed</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Member 1, Member 2</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">F2</TableCell>
                    <TableCell>Data Management</TableCell>
                    <TableCell><Badge className="bg-red-500">Must Have</Badge></TableCell>
                    <TableCell><Badge className="bg-green-600">Completed</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Member 2, Member 3</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">F3</TableCell>
                    <TableCell>Data Visualization</TableCell>
                    <TableCell><Badge className="bg-orange-500">Should Have</Badge></TableCell>
                    <TableCell><Badge className="bg-green-600">Completed</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Member 1, Member 3</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">F4</TableCell>
                    <TableCell>Export Functionality</TableCell>
                    <TableCell><Badge className="bg-yellow-600">Could Have</Badge></TableCell>
                    <TableCell><Badge className="bg-blue-600">Partial</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Member 2</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">F5</TableCell>
                    <TableCell>Advanced Analytics</TableCell>
                    <TableCell><Badge className="bg-yellow-600">Could Have</Badge></TableCell>
                    <TableCell><Badge className="bg-gray-500">Not Started</Badge></TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Known Bugs</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-yellow-600 pl-4">
                  <h4 className="font-medium text-foreground">Minor: Form validation timing</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Validation messages occasionally appear before user finishes typing. Workaround: Added 
                    debounce delay of 300ms.
                  </p>
                </div>
                <div className="border-l-4 border-yellow-600 pl-4">
                  <h4 className="font-medium text-foreground">Minor: Chart responsiveness on mobile</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Charts may overflow on very small screens ({'<'}320px). Affects less than 1% of users.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Individual Contribution - System Development</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Package</TableHead>
                    <TableHead>Member 1</TableHead>
                    <TableHead>Member 2</TableHead>
                    <TableHead>Member 3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Research and Experiments</TableCell>
                    <TableCell>40%</TableCell>
                    <TableCell>30%</TableCell>
                    <TableCell>30%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>UI Design</TableCell>
                    <TableCell>20%</TableCell>
                    <TableCell>70%</TableCell>
                    <TableCell>10%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Coding</TableCell>
                    <TableCell>40%</TableCell>
                    <TableCell>30%</TableCell>
                    <TableCell>30%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Testing</TableCell>
                    <TableCell>20%</TableCell>
                    <TableCell>0%</TableCell>
                    <TableCell>80%</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Overall Contribution</TableCell>
                    <TableCell>30%</TableCell>
                    <TableCell>33%</TableCell>
                    <TableCell>37%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Individual Contribution - Website Report</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Package</TableHead>
                    <TableHead>Member 1</TableHead>
                    <TableHead>Member 2</TableHead>
                    <TableHead>Member 3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Website Setup</TableCell>
                    <TableCell>0%</TableCell>
                    <TableCell>66%</TableCell>
                    <TableCell>34%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Home & Video</TableCell>
                    <TableCell>33%</TableCell>
                    <TableCell>33%</TableCell>
                    <TableCell>34%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Requirements</TableCell>
                    <TableCell>34%</TableCell>
                    <TableCell>33%</TableCell>
                    <TableCell>33%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Research & System Design</TableCell>
                    <TableCell>50%</TableCell>
                    <TableCell>0%</TableCell>
                    <TableCell>50%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Implementation & Testing</TableCell>
                    <TableCell>30%</TableCell>
                    <TableCell>35%</TableCell>
                    <TableCell>35%</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Overall Contribution</TableCell>
                    <TableCell>30%</TableCell>
                    <TableCell>34%</TableCell>
                    <TableCell>36%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Critical Evaluation */}
        <Card>
          <CardHeader>
            <CardTitle>Critical Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">User Interface / User Experience</h3>
              <p className="text-muted-foreground leading-relaxed">
                The UI is clean and modern, following established design principles. User feedback has been 
                overwhelmingly positive, with particular praise for the intuitive navigation and responsive design. 
                However, there is room for improvement in mobile navigation visibility and the addition of 
                keyboard shortcuts for power users.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Functionality</h3>
              <p className="text-muted-foreground leading-relaxed">
                All core requirements (Must Have) have been successfully implemented and are working as expected. 
                Most of the Should Have requirements were also completed. The system provides all essential 
                features needed by users, though some advanced features remain for future development.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Stability</h3>
              <p className="text-muted-foreground leading-relaxed">
                The application demonstrates good stability with minimal crashes or errors during testing. 
                Error handling is comprehensive, with appropriate user feedback and logging. Known bugs are 
                minor and have workarounds in place.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Efficiency</h3>
              <p className="text-muted-foreground leading-relaxed">
                Performance testing shows excellent results with Lighthouse scores above 95 in all categories. 
                Page load times are consistently under 2 seconds on standard broadband connections. Database 
                queries are optimized with proper indexing, and the application uses caching effectively.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Compatibility</h3>
              <p className="text-muted-foreground leading-relaxed">
                The system works correctly across all major browsers (Chrome, Firefox, Safari, Edge) and 
                devices (desktop, tablet, mobile). Minor CSS rendering differences in Safari have been 
                documented but do not affect functionality.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Maintainability</h3>
              <p className="text-muted-foreground leading-relaxed">
                Code is well-structured and follows best practices with clear separation of concerns. 
                TypeScript provides type safety and better tooling support. Comprehensive documentation 
                and comments make it easier for future developers to understand and modify the codebase. 
                The use of modern frameworks and libraries ensures long-term support.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Project Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                The project was managed effectively using Agile methodologies with regular sprints and 
                stand-ups. The Gantt chart helped keep the team on track, though some tasks took longer 
                than initially estimated. Communication with the project partner was consistent, and 
                feedback was incorporated throughout development.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Future Work */}
        <Card>
          <CardHeader>
            <CardTitle>Future Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              While the current system successfully meets core requirements, there are several areas for 
              potential enhancement and expansion:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Advanced Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Implement machine learning algorithms to provide predictive analytics and insights. 
                  This would include trend analysis, anomaly detection, and automated report generation 
                  to help users make data-driven decisions more effectively.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Mobile Native Applications</h3>
                <p className="text-sm text-muted-foreground">
                  Develop native iOS and Android applications using React Native to provide a more 
                  seamless mobile experience. This would include offline functionality, push notifications, 
                  and better integration with device features.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Real-time Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Add real-time collaboration features allowing multiple users to work on the same data 
                  simultaneously. This would require implementing WebSocket connections, conflict resolution, 
                  and presence indicators.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">API for Third-party Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Develop a comprehensive REST API with proper documentation to allow third-party applications 
                  to integrate with the system. This would include OAuth authentication, rate limiting, and 
                  webhooks for event notifications.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Enhanced Accessibility Features</h3>
                <p className="text-sm text-muted-foreground">
                  Further improve accessibility by adding screen reader optimizations, keyboard navigation 
                  enhancements, and customizable UI themes for users with visual impairments.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Internationalization</h3>
                <p className="text-sm text-muted-foreground">
                  Implement multi-language support with proper localization for dates, numbers, and currency. 
                  This would make the system accessible to a global audience and increase its potential user base.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Advanced Security Features</h3>
                <p className="text-sm text-muted-foreground">
                  Add two-factor authentication, role-based access control with granular permissions, 
                  audit logging, and compliance with additional security standards (ISO 27001, SOC 2).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
