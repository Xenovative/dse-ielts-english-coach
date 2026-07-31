import { clearSessionCookie } from "@/lib/auth/session";
import { ok, handleUnknownError } from "@/lib/utils/api";

export async function POST() {
  try {
    await clearSessionCookie();
    return ok({ success: true });
  } catch (err) {
    return handleUnknownError(err);
  }
}
