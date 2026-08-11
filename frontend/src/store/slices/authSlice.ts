import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "../../services/tokenStorage";
import { parseApiErrorPayload } from "../../utils/apiError";
import type { UserProfile } from "../../types/auth";

const getErrorMessage = (payload: any, fallback: string) => {
  return parseApiErrorPayload(payload) ?? fallback;
};

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isChecking: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getAccessToken() || !!getRefreshToken(),
  isLoading: false,
  isChecking: !!getAccessToken() || !!getRefreshToken(),
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    data: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      organization_name: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/auth/register", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    let token = getAccessToken();
    const refresh = getRefreshToken();

    if (!token && refresh) {
      try {
        const refreshResponse = await api.post("/auth/refresh", { refresh });
        const nextRefresh = refreshResponse.data.refresh || refresh;
        setAuthTokens({
          access: refreshResponse.data.access,
          refresh: nextRefresh,
        });
        token = refreshResponse.data.access;
      } catch (error: any) {
        clearAuthTokens();
        return rejectWithValue(error.response?.data);
      }
    }

    if (!token) {
      return rejectWithValue("No token");
    }

    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error: any) {
      clearAuthTokens();
      return rejectWithValue(error.response?.data);
    }
  },
  {
    condition: () => !!getAccessToken() || !!getRefreshToken(),
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const refresh = getRefreshToken();
      if (refresh) {
        await api.post("/auth/logout", { refresh });
      }
      clearAuthTokens();
      return null;
    } catch (error) {
      clearAuthTokens();
      return rejectWithValue("Logout failed");
    }
  }
);

export const refreshAuth = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    const refresh = getRefreshToken();
    if (!refresh) {
      return rejectWithValue("No refresh token");
    }

    try {
      const response = await api.post("/auth/refresh", { refresh });
      const nextRefresh = response.data.refresh || refresh;
      setAuthTokens({ access: response.data.access, refresh: nextRefresh });
      return response.data;
    } catch (error: any) {
      clearAuthTokens();
      return rejectWithValue(error.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action) => {
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      setAuthTokens({
        access: action.payload.access,
        refresh: action.payload.refresh,
      });
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isChecking = false;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        setAuthTokens({
          access: action.payload.access,
          refresh: action.payload.refresh,
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isChecking = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = getErrorMessage(action.payload, "Login failed");
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isChecking = false;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        setAuthTokens({
          access: action.payload.access,
          refresh: action.payload.refresh,
        });
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isChecking = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = getErrorMessage(action.payload, "Registration failed");
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isChecking = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.accessToken = getAccessToken();
        state.refreshToken = getRefreshToken();
      })
      .addCase(checkAuth.pending, (state) => {
        state.isChecking = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isChecking = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      .addCase(refreshAuth.fulfilled, (state, action) => {
        state.isChecking = false;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh || state.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshAuth.rejected, (state) => {
        state.isChecking = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isChecking = false;
      });
  },
});

export const { setTokens, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
