import { useQuery } from '@tanstack/react-query';
import { getCardConfig } from '@/services/cardPayments';
import { useAuth } from '@/context/AuthContext';

export function useCardPaymentConfig() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['card-payment-config', user?.id], queryFn: getCardConfig, staleTime: 0, enabled: Boolean(user) });
}
