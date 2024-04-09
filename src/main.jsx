import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import "primeicons/primeicons.css"
import { PrimeReactProvider } from "primereact/api"
import { createBrowserRouter, redirect, RouterProvider } from "react-router-dom"

const router = createBrowserRouter([
  {
    path: "",
    element: <App id={0} />,
  },
  {
    path: "0",
    element: <App id={0} />,
  },
  {
    path: "1",
    element: <App id={1} />,
  },
  {
    path: "2",
    element: <App id={2} />,
  },
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <PrimeReactProvider
    value={{
      ripple: true,
      locale: "ru",
    }}>
    <RouterProvider router={router} />
  </PrimeReactProvider>
)
