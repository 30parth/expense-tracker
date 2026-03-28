import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/auth-context"

export const ProtectedRoute = () => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
