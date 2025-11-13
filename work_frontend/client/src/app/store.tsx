// src/app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import globalReducer from "@/state"; // sidebar
import authReducer from "@/state/authSlice"; // mới

export const store = configureStore({
  reducer: {
    global: globalReducer,
    auth: authReducer,
  },
  // Redux Toolkit tự động bật devTools ở dev
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
