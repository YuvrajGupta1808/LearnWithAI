import { insforge, isInsforgeConfigured } from "./insforgeClient";

const SYSTEM_PROMPT =
  "You generate strict JSON only. Do not wrap JSON in markdown code fences.";

const cleanJson = (text) => {
  if (!text) return "{}";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return cleaned;
};

const toResponseShape = (text) => ({
  response: {
    text: () => cleanJson(text),
  },
});

const generateWithAPI = async (prompt) => {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate AI content");
  }

  const data = await response.json();
  return data.result;
};

const generateWithInsforge = async (prompt) => {
  if (!isInsforgeConfigured || !insforge) {
    throw new Error(
      "InsForge AI fallback is unavailable. Configure NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY."
    );
  }

  const insforgeModel = process.env.NEXT_PUBLIC_INSFORGE_AI_MODEL || "openai/gpt-4o-mini";
  const { data, error } = await insforge.ai.chat.completions.create({
    model: insforgeModel,
    temperature: 0.7,
    messages: [
      { role: "system", content: "You generate strict JSON only. Do not wrap JSON in markdown code fences." },
      { role: "user", content: prompt },
    ],
  });

  if (error) {
    throw new Error(error.message || "InsForge AI request failed.");
  }

  return data?.choices?.[0]?.message?.content || "{}";
};

const createChatWrapper = () => ({
  async sendMessage(prompt) {
    try {
      const text = await generateWithAPI(prompt);
      return toResponseShape(text);
    } catch (error) {
      console.warn("Primary AI failed, attempting InsForge fallback...", error);
      
      // If it's a 429 or 500, try fallback
      try {
        const fallbackText = await generateWithInsforge(prompt);
        return toResponseShape(fallbackText);
      } catch (fallbackError) {
        console.error("Both AI providers failed:", fallbackError);
        throw error; // Throw the original error if fallback also fails
      }
    }
  },
});

export const GenerateCourseLayout_AI = createChatWrapper();
export const GenerateChapterContent_AI = createChatWrapper();
