// src/pages/super-admin/organizations.tsx

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Building2,
  ChevronRight,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateOrganizationModal } from "@/components/modals/create-organizations-modal"
import { organizationAPI, type Organization } from "@/services/organization.service"

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const data = await organizationAPI.getAll()
        setOrganizations(data.organizations)
      } catch (error) {
        console.error("Failed to fetch organizations:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrganizations()
  }, [])

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOrganizationCreated = (newOrg: Organization) => {
    setOrganizations(prev => [newOrg, ...prev])
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Super Admin
            </p>

            <h1 className="font-heading text-4xl font-bold tracking-tight">
              Organizations
            </h1>

            <p className="text-muted-foreground">
              Manage organizations and feature access.
            </p>
          </div>

          <CreateOrganizationModal onSuccess={handleOrganizationCreated} />
        </div>

        {/* SEARCH */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search organizations..."
            className="h-11 rounded-2xl pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <Card className="rounded-4xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading organizations...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Admins</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No organizations found" : "No organizations yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations.map((organization) => (
                      <TableRow key={organization._id}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>

                            <div>
                              <p className="font-medium">
                                {organization.name}
                              </p>

                              <p className="text-sm text-muted-foreground">
                                {organization._id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          1
                        </TableCell>

                        <TableCell>
                          {organization.userCount ?? 0}
                        </TableCell>

                        <TableCell>
                          {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            asChild
                            variant="outline"
                            className="rounded-xl"
                          >
                            <Link
                              to={`/super-admin/organizations/${organization._id}`}
                            >
                              View
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}