import React from "react"
import { createRoot } from "react-dom/client"
import { DebugApp } from "./DebugApp"
import "./styles.css"

const root = document.querySelector("#root")

if (!root) {
  throw new Error("Root element #root was not found.")
}

createRoot(root).render(
  <React.StrictMode>
    <DebugApp />
  </React.StrictMode>
)
