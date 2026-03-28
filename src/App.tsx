import { BrowserRouter, Route, Routes } from "react-router-dom"
import AppLayout from "./layout/app-layout"
import Home from "./pages/home"
import { Fields } from "./pages/field"
import SignIn from "./pages/sign-in"
import SignUp from "./pages/sign-up"
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from "./components/protected-route"
import { PublicRoute } from "./components/public-route"

export function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="field" element={<Fields />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
