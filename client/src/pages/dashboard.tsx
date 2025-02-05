import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TestChart } from "@/components/blood-test/test-chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, FileText } from "lucide-react";
import type { BloodTest } from "@shared/schema";

export default function Dashboard() {
  const { data: tests, isLoading } = useQuery<BloodTest[]>({
    queryKey: ["/api/tests/1"], // TODO: Replace with actual user ID
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full h-[300px] animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const processTestData = (metric: string) => {
    return tests
      ?.map((test) => ({
        date: new Date(test.datePerformed).toLocaleDateString(),
        value: (test.results as Record<string, number>)[metric] || 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Blood Tests</h1>
        <Link href="/upload">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload New Test
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TestChart
          data={processTestData("hemoglobin") || []}
          metric="Hemoglobin"
          unit="g/dL"
        />
        <TestChart
          data={processTestData("glucose") || []}
          metric="Glucose"
          unit="mg/dL"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests?.map((test) => (
              <Link key={test.id} href={`/test/${test.id}`}>
                <div className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <FileText className="h-5 w-5 mr-4" />
                  <div>
                    <p className="font-medium">
                      Blood Test - {new Date(test.datePerformed).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(test.results as Record<string, number>).length} parameters measured
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}