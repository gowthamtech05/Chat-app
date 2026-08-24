export function getUserInitial(name?: string | null): string {
  return name?.trim() ? name.trim().charAt(0).toUpperCase() : "?";
}