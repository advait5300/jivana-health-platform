import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TestAnalysis } from "@/components/blood-test/test-analysis";
import type { BloodTest } from "@shared/schema";

interface AIAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

export default function AIInsights() {
  const { data: test, isLoading } = useQuery<BloodTest>({
    queryKey: ["/api/latest-test"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-[600px] bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p>No blood test data available. Please upload a test first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aiAnalysis = test.aiAnalysis as AIAnalysis | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Health Insights</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Latest Test Results - {new Date(test.datePerformed).toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(test.results as Record<string, number>).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center border-b py-2">
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {aiAnalysis && <TestAnalysis analysis={aiAnalysis} />}
      </div>
    </div>
  );
}