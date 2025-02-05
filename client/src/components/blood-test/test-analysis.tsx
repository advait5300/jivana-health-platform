import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Analysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

interface TestAnalysisProps {
  analysis: Analysis;
}

export function TestAnalysis({ analysis }: TestAnalysisProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            <Alert>
              <AlertTitle>Summary</AlertTitle>
              <AlertDescription>{analysis.summary}</AlertDescription>
            </Alert>

            <div>
              <h3 className="font-semibold mb-2">Key Insights</h3>
              <ul className="list-disc pl-6 space-y-2">
                {analysis.insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Recommendations</h3>
              <ul className="list-disc pl-6 space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {analysis.riskFactors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Risk Factors</h3>
                <ul className="list-disc pl-6 space-y-2">
                  {analysis.riskFactors.map((risk, i) => (
                    <li key={i} className="text-destructive">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
