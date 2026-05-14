"use client";
/**
 * Compatibility layer for React Router → Next.js App Router migration.
 * Import from here instead of "react-router-dom" for navigation hooks.
 */
import {
  useRouter,
  usePathname,
  useSearchParams as nextUseSearchParams,
  useParams as nextUseParams,
} from "next/navigation";

/**
 * Drop-in replacement for React Router's useNavigate.
 * navigate(path) → router.push(path)
 * navigate(-1) → router.back()
 * navigate(path, { replace: true }) → router.replace(path)
 */
export function useNavigate() {
  const router = useRouter();
  return (
    to: string | number,
    options?: { replace?: boolean; state?: unknown },
  ) => {
    if (typeof to === "number") {
      router.back();
    } else if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

/**
 * Drop-in replacement for React Router's useLocation.
 * Returns an object with pathname (and dummy search/state for compat).
 */
export function useLocation() {
  const pathname = usePathname();
  const searchParams = nextUseSearchParams();
  return {
    pathname,
    search: searchParams ? `?${searchParams.toString()}` : "",
    state: null,
  };
}

/**
 * Wraps Next.js useSearchParams.
 * Returns the ReadonlyURLSearchParams object (not a tuple).
 * For components that only READ searchParams, this is a drop-in.
 */
export { nextUseSearchParams as useSearchParams };

/**
 * Drop-in replacement for React Router's useParams.
 */
export { nextUseParams as useParams };

export { useRouter };
