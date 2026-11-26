export type UserChallenge = {
  key: string;
  title: string;
  custom: boolean;
  days: number[];
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  city: string;
  interests: string[];
  timezone: string;
  challenges: UserChallenge[];
  published: boolean;
  teamId: string | null;
  day: number;
};

export type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
};

export type ProfileActions = {
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export type ProfileStore = ProfileState & ProfileActions;
