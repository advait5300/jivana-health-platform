import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Represents the structure of an AI analysis response
 * @interface AIAnalysis
 * @property {string} summary - Overall health status summary
 * @property {string[]} insights - Key observations from the blood test
 * @property {string[]} recommendations - Health recommendations based on results
 * @property {string[]} riskFactors - Potential health risks identified
 */
interface AIAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

/**
 * Analyzes blood test results using OpenAI's GPT-4o model
 * @param {Record<string, number>} results - Blood test results with metric names and values
 * @returns {Promise<AIAnalysis>} Detailed analysis of the blood test results
 * @throws {Error} If OpenAI API call fails or returns invalid response
 * 
 * @example
 * const results = {
 *   hemoglobin: 14.5,
 *   glucose: 95,
 *   cholesterol: 180
 * };
 * const analysis = await analyzeBloodTest(results);
 */
export async function analyzeBloodTest(results: Record<string, number>): Promise<AIAnalysis> {
  // In development, return mock analysis if no API key
  if (process.env.NODE_ENV !== "production" && !process.env.OPENAI_API_KEY) {
    return {
      summary: "Development mode: Mock analysis",
      insights: ["Development: Normal hemoglobin levels", "Development: Glucose within range"],
      recommendations: ["Development: Continue regular check-ups", "Development: Maintain healthy diet"],
      riskFactors: [],
    };
  }

  try {
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
  } catch (error) {
    console.error("OpenAI API error:", error);
    // In case of API error, return a basic analysis to allow upload to complete
    return {
      summary: "Analysis unavailable at the moment",
      insights: ["Test results recorded successfully"],
      recommendations: ["Please consult with your healthcare provider to interpret results"],
      riskFactors: [],
    };
  }
}