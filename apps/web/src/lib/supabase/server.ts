import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  const store = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values: { name: string; value: string; options: CookieOptions }[]) => {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Components cannot persist refreshed cookies. Proxy handles it. */ }
      },
    },
  });
}
