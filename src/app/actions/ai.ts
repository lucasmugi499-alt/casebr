"use server";

import { GoogleGenAI } from "@google/genai";

const systemPrompt = `You are an assistant helping shelter and social service workers draft objective, professional case notes. Rewrite the user's rough notes into a clear, factual, trauma-informed, harm-reduction-aligned case note.

Rules:
- Do not invent facts.
- Do not diagnose the client.
- Do not include information that was not provided.
- Use objective and professional language.
- Clearly distinguish between what the client reported and what staff observed.
- Avoid judgmental, stigmatizing, or blaming language.
- Include follow-up actions only if provided.
- If safety concerns are not mentioned, do not assume any.
- Keep the note concise but complete.`;

export async function generateCaseNote(roughNotes: string, actionType: string = "smis") {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // Mock generation if no API key is provided
      console.warn("No GEMINI_API_KEY provided. Using mock generation.");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      
      let modifierText = "";
      if (actionType === "professional") modifierText = " (Made more professional)";
      if (actionType === "shorter") modifierText = " (Shortened)";
      if (actionType === "objective") modifierText = " (Made objective)";
      
      return {
        success: true,
        data: `[MOCK AI GENERATED NOTE]${modifierText}\n\nClient reported: ${roughNotes.substring(0, 50)}...\n\nStaff observed: Client appeared calm. Discussed housing options.`,
        isMock: true
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    let userPrompt = `Rough Notes:\n${roughNotes}\n\nPlease generate a standard professional case note.`;
    
    if (actionType === "professional") {
      userPrompt = `Rough Notes:\n${roughNotes}\n\nPlease rewrite these notes to sound highly professional and appropriate for a clinical or official record.`;
    } else if (actionType === "shorter") {
      userPrompt = `Rough Notes:\n${roughNotes}\n\nPlease summarize these notes to be as brief and concise as possible while retaining all facts.`;
    } else if (actionType === "objective") {
      userPrompt = `Rough Notes:\n${roughNotes}\n\nPlease rewrite these notes to be completely objective, removing all subjectivity, assumptions, and judgmental language.`;
    } else if (actionType === "supervisor") {
      userPrompt = `Rough Notes:\n${roughNotes}\n\nPlease convert these notes into a brief executive summary for a supervisor's quick review.`;
    } else if (actionType === "followup") {
      userPrompt = `Rough Notes:\n${roughNotes}\n\nPlease extract only the follow-up tasks and action items from these notes.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Low temperature for more objective/factual responses
      }
    });

    return {
      success: true,
      data: response.text,
      isMock: false
    };
  } catch (error: any) {
    console.error("Error generating case note:", error);
    return {
      success: false,
      error: error.message || "Failed to generate case note"
    };
  }
}
