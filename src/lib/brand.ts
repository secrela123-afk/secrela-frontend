/** Public product name shown in the UI (not the internal repo name). */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Secrela";

export function pageTitle(segment: string): string {
  return `${segment} — ${APP_NAME}`;
}
