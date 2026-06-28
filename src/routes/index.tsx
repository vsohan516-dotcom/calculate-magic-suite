import { createFileRoute } from "@tanstack/react-router";
import { CalculatorApp } from "@/components/calculator/CalculatorApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Calc — Premium calculator suite" },
      {
        name: "description",
        content:
          "A modern calculator with scientific, unit, currency, EMI, GST, BMI, age and tip tools — glass UI, voice input, and full history.",
      },
      { property: "og:title", content: "Lumen Calc — Premium calculator suite" },
      {
        property: "og:description",
        content:
          "Scientific, unit, currency, EMI, GST, BMI and more — in one beautiful, accessible calculator.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <h1 className="sr-only">Lumen Calc — premium calculator suite</h1>
      <CalculatorApp />
    </>
  );
}
