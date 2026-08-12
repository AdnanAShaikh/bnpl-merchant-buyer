import { configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from "redux-persist";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";   
import orderReducer from "./slices/orderSlice";   
import merchantReducer from "./slices/merchantSlice";   
import buyerReducer from "./slices/buyerSlice";   

// ← explicit localStorage storage object instead of import
const storage = {
  getItem:    (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem:    (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

const persistConfig = {
  key:      "auth",
  storage,
  whitelist: ["user"],
};

const persistedReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedReducer,
    product: productReducer,   
    order: orderReducer,   
    merchant: merchantReducer,   
    buyer: buyerReducer,


  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;