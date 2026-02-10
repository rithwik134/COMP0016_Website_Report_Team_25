import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12 lg:px-8">
        {/* Project Title */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4 text-balance">
            COMP0016 Systems Engineering Project
          </h1>
          <p className="text-xl text-muted-foreground">
            Final Prototype Deliverables and Assessment
          </p>
        </div>

        {/* Abstract */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Abstract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Problem Statement</h3>
              <p className="text-muted-foreground leading-relaxed">
                This section should describe the problem your project aims to solve. Include details about the challenges, 
                the context of the problem, and why it's important to address. Consider discussing the current limitations 
                in existing solutions and the specific needs of your target users.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Your Solution</h3>
              <p className="text-muted-foreground leading-relaxed">
                Describe your proposed solution and approach to solving the problem. Explain the key features and 
                functionalities of your system, the technologies you've chosen, and how they address the identified 
                challenges. Highlight what makes your solution unique or innovative.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Achievement and Impact</h3>
              <p className="text-muted-foreground leading-relaxed">
                Summarize the outcomes of your project, including what you've successfully implemented and the impact 
                it has had. Discuss any metrics, user feedback, or evaluation results that demonstrate the effectiveness 
                of your solution. Consider mentioning future potential and scalability.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Video Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Project Demo Video</CardTitle>
            <CardDescription>
              An 8-minute video introducing the project and demonstrating all implemented functionalities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Video placeholder - Add your demo video here</p>
            </div>
          </CardContent>
        </Card>

        {/* Development Team */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Development Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((member) => (
                <div key={member} className="space-y-3">
                  <div className="aspect-square bg-secondary rounded-lg flex items-center justify-center">
                    <span className="text-4xl text-muted-foreground">👤</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Team Member {member}</h3>
                    <p className="text-sm text-muted-foreground">member{member}@ucl.ac.uk</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">UI Design</Badge>
                      <Badge variant="secondary">Programming</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Project Management</CardTitle>
            <CardDescription>
              Gantt chart showing project timeline from October 20, 2025 to March 27, 2026
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[16/9] bg-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Gantt chart placeholder - Add your project timeline here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
