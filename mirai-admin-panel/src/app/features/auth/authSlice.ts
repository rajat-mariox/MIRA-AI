import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearSession, getStoredUser, getToken, USER_KEY, TOKEN_KEY } from "../../../lib/session";

export interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const token = getToken();

const initialState: AuthState = {
  token,
  user: getStoredUser<AuthUser>(),
  isAuthenticated: !!token,
};

function persistUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      try {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
      } catch {
        /* storage unavailable */
      }
      persistUser(action.payload.user);
    },

    /** Local-only profile change (there is no admin profile update endpoint). */
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      state.user = { ...state.user, ...action.payload };
      persistUser(state.user);
    },

    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      clearSession();
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;
