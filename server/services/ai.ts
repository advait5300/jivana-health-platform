import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

export async function analyzeBloodTest(results: Record<string, number>): Promise<AIAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a medical expert analyzing blood test results. Provide insights and recommendations based on the test values. Return JSON in the format: { summary: string, insights: string[], recommendations: string[], riskFactors: string[] }",
      },
      {
        role: "user",
        content: JSON.stringify(results),
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const analysis: AIAnalysis = JSON.parse(content);
  return analysis;
}