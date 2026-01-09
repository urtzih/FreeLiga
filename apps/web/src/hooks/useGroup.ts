import { useAuth } from '../contexts/AuthContext';

export function useGroup() {
  const { user, loading } = useAuth();

  const currentGroup = user?.player?.currentGroup || null;

  return {
    currentGroup,
    loading,
  };
}
