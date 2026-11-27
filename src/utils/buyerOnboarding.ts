import { getProfileAction } from "@/app/actions/profile";
import { commerceService } from "@/services/commerceService";

export async function buyerNeedsOnboarding(userId: string): Promise<boolean> {
  try {
    const [result, addresses] = await Promise.all([
      getProfileAction({ id: userId }),
      commerceService.getUserAddresses(),
    ]);
    const profile = result?.data;
    return Boolean(result?.serverError || !profile?.first_name?.trim() ||
      !profile?.last_name?.trim() || !profile?.dni ||
      !(profile?.phone || profile?.phone_number)?.trim() || !addresses?.length);
  } catch {
    return true;
  }
}
