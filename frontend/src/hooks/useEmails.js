import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailService } from '../services/auth';

export const useEmails = (bucketId) => {
  return useQuery({
    queryKey: ['emails', bucketId],
    queryFn: () => emailService.getEmails({ bucketId })
  });
};

export const useSyncEmails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailService.syncEmails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    }
  });
};

export const useUpdateEmailBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ emailId, bucketId }) => emailService.updateEmailBucket(emailId, bucketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    }
  });
};
