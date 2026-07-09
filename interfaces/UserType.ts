interface UserType {
  userData: {
    id: string;
    email: string;
    name: string;
    token: string;
  } | null;
  isAuthenticated: boolean;
  error: string | null;
}

export default UserType;
