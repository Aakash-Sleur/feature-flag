import { Navigate } from "react-router-dom"
import { useUser } from "@/context/user-context"
import { type UserRoleType } from "@/lib/types"


interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRoleType
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // NOT LOGGED IN
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // ROLE CHECK
  if (
    allowedRoles &&
    user &&
    user?.role &&
    !allowedRoles.includes(user.role as UserRoleType)
  ) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}