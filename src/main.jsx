import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import { PrimeReactProvider } from "primereact/api"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PrimeReactProvider value={{
      ripple: true,
      locale: "ru",
    }}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
)
