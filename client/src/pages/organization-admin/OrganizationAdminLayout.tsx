// src/pages/org-admin/OrgAdminLayout.tsx

import { useUser } from "@/context/user-context"

import {
  Flag,
  LogOut,
} from "lucide-react"

import {
  Link,
  Navigate,
  NavLink,
  Outlet,
} from "react-router-dom"

import { Button } from "@/components/ui/button"

const navigation = [
  {
    label: "Feature Flags",
    href: "/org/feature-flags",
    icon: Flag,
  },
]

const OrgAdminLayout = () => {
  const {
    isLoading,
    isAuthenticated,
    user,
    logout,
  } = useUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Loading...
        </p>
      </div>
    )
  }

  // NOT AUTHENTICATED
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // INVALID ROLE
  if (user?.role !== "ORG_ADMIN") {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* LEFT */}
          <div className="flex items-center gap-10">
            <Link
              to="/org/dashboard"
              className="font-heading flex items-center text-xl font-bold tracking-tight"
            >
              <Flag fill="black" className="text-sm mr-2"/>
            <span>

              Feature Flags
            </span>
            </Link>

          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-muted-foreground">
                Organization Admin
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default OrgAdminLayout