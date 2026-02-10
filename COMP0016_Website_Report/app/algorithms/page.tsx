import { PageLayout } from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AlgorithmsPage() {
  return (
    <PageLayout title="Algorithms">
      <div className="space-y-8">
        {/* Models */}
        <Card>
          <CardHeader>
            <CardTitle>Models and Algorithms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Describe the key algorithms and models used in your project. Explain the fundamental concepts, 
              mathematical foundations, and why these particular algorithms were chosen. Include details about 
              how they address your specific problem domain.
            </p>
            <div className="bg-secondary rounded-lg p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{`// Example algorithm pseudocode
function algorithmName(input):
    // Initialize variables
    result = []
    
    // Main algorithm logic
    for each item in input:
        if condition(item):
            process(item)
            result.append(item)
    
    return result`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Dataset</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Describe your dataset including its source, size, characteristics, and how it was collected. 
                Explain why this dataset is appropriate for your problem and any limitations it may have.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">10,000</div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">15</div>
                  <div className="text-sm text-muted-foreground">Features</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">5</div>
                  <div className="text-sm text-muted-foreground">Classes</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">80/20</div>
                  <div className="text-sm text-muted-foreground">Train/Test Split</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Data Preprocessing</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Data cleaning and handling missing values</li>
                <li>Feature normalization and standardization</li>
                <li>Encoding categorical variables</li>
                <li>Feature selection and dimensionality reduction</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Training and Testing Sets</h3>
              <p className="text-muted-foreground leading-relaxed">
                Explain how you split your data into training and testing sets. Discuss any cross-validation 
                strategies used and how you ensured the split maintains data distribution.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Experiments */}
        <Card>
          <CardHeader>
            <CardTitle>Experiments and Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Experiment Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Describe your experimental setup, including the metrics used for evaluation, the baseline 
                models you compared against, and the methodology for conducting fair comparisons.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Performance Evaluation</h3>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Primary evaluation metric: <Badge>Accuracy</Badge> <Badge>Precision</Badge> <Badge>Recall</Badge> <Badge>F1-Score</Badge>
                </p>
                <div className="border rounded-lg p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-primary">92.5%</div>
                      <div className="text-sm text-muted-foreground mt-1">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">91.2%</div>
                      <div className="text-sm text-muted-foreground mt-1">Precision</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">93.8%</div>
                      <div className="text-sm text-muted-foreground mt-1">Recall</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">92.5%</div>
                      <div className="text-sm text-muted-foreground mt-1">F1-Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Performance Comparison</h3>
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Performance comparison chart placeholder</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2 italic">
                Include charts or tables comparing different models or hyperparameter configurations
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Hyperparameter Investigation</h3>
              <p className="text-muted-foreground leading-relaxed">
                If applicable, describe the hyperparameter tuning process, the parameters investigated, 
                and how different values affected model performance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Discussion */}
        <Card>
          <CardHeader>
            <CardTitle>Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Analysis of Results</h3>
              <p className="text-muted-foreground leading-relaxed">
                Provide an in-depth analysis of your results. Discuss patterns observed in the data, 
                why certain approaches worked better than others, and any surprising findings.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Failure Cases</h3>
              <p className="text-muted-foreground leading-relaxed">
                Examine cases where the algorithm failed or performed poorly. Explain why these failures 
                occurred and what characteristics of the input data caused the poor performance.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Suggestions for Improvement</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Collecting more diverse training data</li>
                <li>Implementing ensemble methods</li>
                <li>Fine-tuning hyperparameters further</li>
                <li>Exploring alternative algorithms or architectures</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Conclusion */}
        <Card>
          <CardHeader>
            <CardTitle>Conclusion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Summarize the key findings from your algorithmic work. Highlight the most effective 
              approaches, the overall performance achieved, and how well the algorithms met the 
              project requirements.
            </p>
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
                Author Name, "Algorithm Paper Title," <em>Conference/Journal Name</em>, Year.
              </li>
              <li>
                Author Name, "Machine Learning Book," Publisher, Year.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
