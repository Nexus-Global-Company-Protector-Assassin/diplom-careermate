import { useMutation } from '@tanstack/react-query';
import { api, ProfileDto, PocRunResponseDto } from '@/shared/api';

export const useRunPoc = () => {
  return useMutation<PocRunResponseDto, Error, ProfileDto>({
    mutationFn: async (profileData: ProfileDto) => {
      const response = await api.post<PocRunResponseDto>('/poc/run', profileData);
      
      // If the backend has not yet fully implemented this route, it might return 404/500
      // the ApiClient throws errors if !response.ok, so this will automatically enter the `isError` state.
      return response; 
    },
  });
};
