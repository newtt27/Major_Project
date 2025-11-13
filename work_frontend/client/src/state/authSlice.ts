// src/state/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  userId: number | null;        
  departmentId: number | null;  
  roles: string[];
}

const initialState: AuthState = {
  token: null,
  permissions: [],
  roles: [],
  isAuthenticated: false,
  userId: null,                
  departmentId: null,           
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ 
      accessToken: string; 
      permissions: string[]; 
      userId: number;           
      departmentId?: number;    
      roles: string [];
    }>) => {
      state.token = action.payload.accessToken;
      state.permissions = action.payload.permissions;
      state.userId = action.payload.userId;         // ✅ LƯU
      state.departmentId = action.payload.departmentId ?? null;  // ✅ LƯU
      state.isAuthenticated = true;
      state.roles = action.payload.roles || [];
    },
    logout: (state) => {
      state.token = null;
      state.permissions = [];
      state.userId = null;          // ✅ RESET
      state.departmentId = null;    // ✅ RESET
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;