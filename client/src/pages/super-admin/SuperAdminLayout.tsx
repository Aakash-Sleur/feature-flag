import { useUser } from "@/context/user-context"

import {
  Building2,
  LayoutDashboard,
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
    label: "Dashboard",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Organizations",
    href: "/super-admin/organizations",
    icon: Building2,
  },
]

const SuperAdminLayout = () => {
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

  // NOT LOGGED IN
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // WRONG ROLE
  if (user?.role !== "SUPER_ADMIN") {
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
              to="/super-admin/dashboard"
              className="font-heading text-xl font-bold tracking-tight"
            >
              Feature Flags
            </Link>

            {/* NAVIGATION */}
            <nav className="hidden items-center gap-2 md:flex">
              {navigation.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      [
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-muted-foreground">
                Super Admin
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

export default SuperAdminLayout