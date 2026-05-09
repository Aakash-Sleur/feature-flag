// src/pages/shared/not-found.tsx

import { Link } from "react-router-dom"
import { ArrowLeft, Home } from "lucide-react"

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl rounded-4xl border border-border bg-card p-10 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Error 404
            </p>

            <h1 className="font-heading text-5xl font-bold tracking-tight">
              Page not found
            </h1>

            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              The page you are trying to access does not exist or may
              have been moved.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}