export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  END_USER: "END_USER",
} as const

export type UserRoleType =
  (typeof UserRole)[keyof typeof UserRole]