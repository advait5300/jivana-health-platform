import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { TestAnalysis } from "@/components/blood-test/test-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2 } from "lucide-react";
import type { BloodTest } from "@shared/schema";

interface AIAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

export default function TestDetails() {
  const [, params] = useRoute("/test/:id");

  const { data: test, isLoading } = useQuery<BloodTest>({
    queryKey: [`/api/test/${params?.id}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[600px] bg-muted rounded" />
            <div className="h-[600px] bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return <div>Test not found</div>;
  }

  const aiAnalysis = test.aiAnalysis as AIAnalysis | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Blood Test Results - {new Date(test.datePerformed).toLocaleDateString()}
        </h1>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Results
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
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