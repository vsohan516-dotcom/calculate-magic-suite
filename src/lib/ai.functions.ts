import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SolveInput = z.object({
  problem: z.string().min(1),
  language: z.enum(["en", "hi"]).default("en"),
});

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";

/** Step-by-step math solver powered by Lovable AI. */
export const solveMath = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SolveInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");

    const instructions =
      data.language === "hi"
        ? "आप एक गणित शिक्षक हैं। हल को क्रमबद्ध चरणों में हिंदी में समझाएँ। अंत में 'उत्तर:' लिखकर अंतिम उत्तर दें। Markdown में उत्तर दें, संक्षिप्त रखें।"
        : "You are a patient math tutor. Solve the problem with clear numbered steps, showing the work for each step. End with a line starting 'Answer:'. Reply in concise Markdown.";

    const response = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        instructions,
        input: data.problem,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) throw new Error("Rate limit reached — try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted — add credits to continue.");
      throw new Error(`AI request failed [${response.status}]: ${body}`);
    }

    const json = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text =
      json.output_text ??
      json.output?.flatMap((o) => o.content?.map((c) => c.text ?? "") ?? []).join("") ??
      "";

    return { text: text.trim() || "No solution returned." };
  });
