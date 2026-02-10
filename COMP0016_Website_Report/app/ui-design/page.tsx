import { PageLayout } from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UIDesignPage() {
  return (
    <PageLayout title="UI Design">
      <div className="space-y-8">
        {/* Design Principles */}
        <Card>
          <CardHeader>
            <CardTitle>Design Principles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our design follows established UI/UX principles to create an intuitive and accessible user experience.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Simplicity</h3>
                <p className="text-sm text-muted-foreground">
                  Clean, uncluttered interfaces that focus on essential features and minimize cognitive load.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Consistency</h3>
                <p className="text-sm text-muted-foreground">
                  Uniform design patterns, colors, and interactions across all pages and components.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Visibility</h3>
                <p className="text-sm text-muted-foreground">
                  Important elements and actions are clearly visible and easily discoverable.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Immediate visual feedback for user actions through animations and state changes.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Tolerance</h3>
                <p className="text-sm text-muted-foreground">
                  Error prevention and recovery mechanisms to handle mistakes gracefully.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Accessibility</h3>
                <p className="text-sm text-muted-foreground">
                  WCAG compliant design ensuring usability for all users, including those with disabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hand-drawn Sketches */}
        <Card>
          <CardHeader>
            <CardTitle>Hand-drawn Sketches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Initial concept sketches exploring different layout options and user flows. These sketches 
              helped us quickly iterate on ideas before committing to high-fidelity designs.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <p className="text-muted-foreground">Sketch 1: Homepage Layout</p>
              </div>
              <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <p className="text-muted-foreground">Sketch 2: Dashboard View</p>
              </div>
              <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <p className="text-muted-foreground">Sketch 3: Data Entry Form</p>
              </div>
              <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <p className="text-muted-foreground">Sketch 4: Mobile Navigation</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground italic">
              Add photos or scans of your hand-drawn UI sketches here
            </p>
          </CardContent>
        </Card>

        {/* Wireframes */}
        <Card>
          <CardHeader>
            <CardTitle>High-Fidelity Wireframes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Interactive wireframes created using Figma showcasing the final design system, component 
              library, and user interface layouts. These wireframes guided the development process and 
              ensured design consistency.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Homepage Wireframe</h3>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                  <p className="text-muted-foreground">Homepage wireframe placeholder</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Dashboard Wireframe</h3>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border">
                  <p className="text-muted-foreground">Dashboard wireframe placeholder</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Mobile Wireframes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[9/16] bg-secondary rounded-lg flex items-center justify-center border">
                      <p className="text-sm text-muted-foreground">Mobile {i}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary rounded-lg p-4 mt-6">
              <p className="text-sm text-foreground">
                <strong>Interactive Prototype:</strong> 
                <a href="#" className="text-primary hover:underline ml-2">
                  View Figma Prototype →
                </a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add the URL to your interactive Figma wireframe here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle>Color Scheme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="h-24 bg-primary rounded-lg border"></div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">Primary</div>
                  <div className="text-muted-foreground font-mono">#3B82F6</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-secondary rounded-lg border"></div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">Secondary</div>
                  <div className="text-muted-foreground font-mono">#F1F5F9</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-foreground rounded-lg border"></div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">Text</div>
                  <div className="text-muted-foreground font-mono">#1E293B</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-muted rounded-lg border"></div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">Muted</div>
                  <div className="text-muted-foreground font-mono">#64748B</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Heading 1 - Inter Bold</h1>
              <h2 className="text-3xl font-semibold">Heading 2 - Inter Semibold</h2>
              <h3 className="text-2xl font-semibold">Heading 3 - Inter Semibold</h3>
              <p className="text-base">Body text - Inter Regular. The quick brown fox jumps over the lazy dog.</p>
              <p className="text-sm text-muted-foreground">Small text - Inter Regular. Used for captions and secondary information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
