import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { Product } from '../../types/product.type';
import {
  OtherUser,
  OtherUserResponse,
  CartItem,
} from '../../types/otherUser.type';

interface OtherUserState {
  user: OtherUser | null;
  products: Product[];
  cart: CartItem[];
  favorites: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: OtherUserState = {
  user: null,
  products: [],
  cart: [],
  favorites: [],
  loading: false,
  error: null,
};

// THUNK
export const fetchOtherUserById = createAsyncThunk<
  OtherUserResponse,
  string
>(
  'otherUser/fetchById',
  async (userId) => {
    const res = await api.get(`/user/${userId}`);
    return res.data;
  }
);

export const deleteUserThunk = createAsyncThunk<
  string,
  string
>(
  'otherUser/deleteUser',
  async (userId, thunkAPI) => {
    try {
      const response = await api.delete(`/user/${userId}`);
      return response.data.message;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        error.message
      );
    }
  }
);


// SLICE
const otherUserSlice = createSlice({
  name: 'otherUser',
  initialState,
  reducers: {
    clearOtherUser: (state) => {
      state.user = null;
      state.products = [];
      state.cart = [];
      state.favorites = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH BY ID
      .addCase(fetchOtherUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.user = null;
      })

      .addCase(
        fetchOtherUserById.fulfilled,
        (state, action: PayloadAction<OtherUserResponse>) => {
          state.loading = false;

          state.user = action.payload.user;
          state.products = action.payload.products;

          state.cart =
            action.payload.cart ??
            action.payload.user.cart ??
            [];

          state.favorites =
            action.payload.favorites ??
            action.payload.user.favorites ??
            [];
        }
      )

      .addCase(fetchOtherUserById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message ?? 'Error al cargar usuario';
      })

      .addCase(deleteUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(deleteUserThunk.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.products = [];
      })

      .addCase(deleteUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
        },
      });

export const { clearOtherUser } = otherUserSlice.actions;
export default otherUserSlice.reducer;