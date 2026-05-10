import { Navigate, Route, Routes } from "react-router-dom"

import { LoginPage } from "./pages/login"
import { RegisterPage } from "./pages/register"
import { InvitePage } from "./pages/invite"

import { ProtectedRoute } from "./components/protected-route"

import SuperAdminLayout from "./pages/super-admin/SuperAdminLayout"
import OrgAdminLayout from "./pages/organization-admin/OrganizationAdminLayout"
import EndUserLayout from "./pages/end-user/EndUserLayout"

// SUPER ADMIN PAGES
import { OrganizationsPage } from "./pages/super-admin/organizations-page"
import { OrganizationDetailsPage } from "./pages/super-admin/organization-details"

// ORG ADMIN PAGES
import { FeatureFlagsPage } from "./pages/organization-admin/feature-flags"

// END USER PAGES
import { UserFeaturesPage } from "./pages/end-user/user-features-page"
  
// SHARED PAGES
import { UnauthorizedPage } from "./pages/shared/unauthorized"
import { NotFoundPage } from "./pages/shared/not-found"
import { UserRole } from "./lib/types"
import { Toaster } from "./components/ui/sonner"

const App = () => {
  return (
    <>
      <Toaster />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* SUPER ADMIN ROUTES */}
      <Route
        element={
          <ProtectedRoute allowedRoles={UserRole.SUPER_ADMIN}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/super-admin/organizations"
          element={<OrganizationsPage />}
        />

        <Route
          path="/super-admin/organizations/:id"
          element={<OrganizationDetailsPage />}
        />
      </Route>

      {/* ORG ADMIN ROUTES */}
      <Route
        element={
          <ProtectedRoute allowedRoles={UserRole.ORG_ADMIN}>
            <OrgAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/org/feature-flags" element={<FeatureFlagsPage />} />


      </Route>

      {/* END USER ROUTES */}
      <Route
        element={
          <ProtectedRoute allowedRoles={UserRole.END_USER}> 
            <EndUserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/user/features" element={<UserFeaturesPage />} />
      </Route>

      {/* SHARED */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  )
}

export default App
