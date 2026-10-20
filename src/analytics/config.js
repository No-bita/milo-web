// PostHog product analytics. Project token is public by design (write-only).
// Override per deploy with VITE_POSTHOG_KEY / VITE_POSTHOG_HOST; an empty key turns analytics off.
export const POSTHOG_KEY = import.meta.env?.VITE_POSTHOG_KEY ?? 'phc_z3idk67WQ6QwKq4m9P86rJeikUMdBjrtd5joyqDPGL2D';
export const POSTHOG_HOST = import.meta.env?.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';
