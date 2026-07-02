import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { CalculatorApp } from "@/components/calculator/CalculatorApp";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found");
}

createRoot(root).render(
  <StrictMode>
    <CalculatorApp />
  </StrictMode>,
);