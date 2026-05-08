import React from "react"
import { createRoot } from "react-dom/client"
import { QuickPlayApp } from "./QuickPlayApp"
import "./styles.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing #root element for quick play renderer")
}

createRoot(rootElement).render(
  <React.StrictMode>
    <QuickPlayApp />
  </React.StrictMode>
)
