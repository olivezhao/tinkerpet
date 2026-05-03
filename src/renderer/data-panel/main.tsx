import React from "react"
import { createRoot } from "react-dom/client"
import { DataPanelApp } from "./DataPanelApp"
import "./styles.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing #root element for data panel renderer")
}

createRoot(rootElement).render(
  <React.StrictMode>
    <DataPanelApp />
  </React.StrictMode>
)

