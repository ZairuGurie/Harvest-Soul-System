export type RoleName =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "EDITOR"
  | "WORSHIP_LEADER"
  | "MEMBER"
  | "GUEST";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role_id: string | null;
  birthday: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  role?: { id: string; name: RoleName; description: string | null } | null;
};

export type AuthUser = {
  id: string;
  email: string;
  profile: Profile;
  role: RoleName;
};
