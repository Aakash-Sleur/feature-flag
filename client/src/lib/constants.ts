import { UserRole, type UserRoleType } from "./types";

// Role to URL mapping
export const roleToUrl: Record<UserRoleType, string> = {
        [UserRole.SUPER_ADMIN]: "/super-admin/organizations",
        [UserRole.ORG_ADMIN]: "/org/feature-flags",
        [UserRole.END_USER]: "/user/features",
    }

/**
 * Get the redirect URL based on user role
 * @param role - The user's role
 * @returns The appropriate redirect URL
 */
export const getRedirectUrl = (role: string): string => {
    return roleToUrl[role as UserRoleType] ?? "/unauthorized"
}
