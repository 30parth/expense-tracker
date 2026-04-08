import { BrowserRouter, Route, Routes } from "react-router-dom"
import AppLayout from "./layout/app-layout"
import Home from "./pages/home"
import { Fields } from "./pages/field"
import SignIn from "./pages/sign-in"
import SignUp from "./pages/sign-up"
import Settings from "./pages/settings"
import Profile from "./pages/profile"
import Transactions from "./pages/transactions"
import Report from "./pages/report"
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
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="report" element={<Report />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
