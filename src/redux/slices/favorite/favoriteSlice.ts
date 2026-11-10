import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import api from '../../api/axios';
import { logout } from '../auth/authSlice';
import { Product } from '../../types/product.type';

// -------------------- THUNKS -------------------- //

// Obtener favoritos del usuario
export const fetchFavorites = createAsyncThunk<any[], void, { state: RootState }>(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/favorite'); // el backend usa el token para saber de quién son
      return res.data; // Array de favoritos (ids de productos)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching favorites');
    }
  }
);

// Productos favoritos completos (lista de "Mi perfil"), sin depender de lo que cargó el inicio
export const fetchFavoriteProducts = createAsyncThunk<Product[], void, { state: RootState }>(
  'favorites/fetchFavoriteProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<Product[]>('/favorite/products');
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching favorite products');
    }
  }
);

// Toggle favorito (like/unlike)
export const toggleFavorite = createAsyncThunk<any[], string, { state: RootState }>(
  'favorites/toggleFavorite',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await api.post('/favorite', { productId });
      return res.data; // Array actualizado de favoritos
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error toggling favorite');
    }
  }
);

// -------------------- SLICE -------------------- //

interface FavoritesState {
  items: string[]; // Lista de productIds (para pintar el corazón)
  products: Product[]; // Productos favoritos completos (lista de "Mi perfil")
  productsLoading: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  items: [],
  products: [],
  productsLoading: false,
  loading: false,
  error: null,
};

// Marca/desmarca en la lista local (el corazón cambia al instante, sin esperar al servidor)
const flip = (items: string[], productId: string) =>
  items.includes(productId) ? items.filter(id => id !== productId) : [...items, productId];

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Al cerrar sesión se limpian los favoritos
    builder.addCase(logout, () => initialState);

    // fetchFavorites
    builder.addCase(fetchFavorites.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFavorites.fulfilled, (state, action: PayloadAction<string[]>) => {
      state.loading = false;
      state.items = action.payload.map(String);
    });
    builder.addCase(fetchFavorites.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || 'Error fetching favorites';
    });

    // fetchFavoriteProducts
    builder.addCase(fetchFavoriteProducts.pending, (state) => {
      state.productsLoading = true;
    });
    builder.addCase(fetchFavoriteProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
      state.productsLoading = false;
      state.products = action.payload;
    });
    builder.addCase(fetchFavoriteProducts.rejected, (state) => {
      state.productsLoading = false;
    });

    // toggleFavorite: cambio inmediato (optimista); si el servidor falla, se deshace
    builder.addCase(toggleFavorite.pending, (state, action) => {
      state.loading = true;
      state.error = null;
      state.items = flip(state.items, action.meta.arg);
      // Si lo quitó, sale de la lista del perfil enseguida
      if (!state.items.includes(action.meta.arg)) {
        state.products = state.products.filter(p => p._id !== action.meta.arg);
      }
    });
    builder.addCase(toggleFavorite.fulfilled, (state, action: PayloadAction<string[]>) => {
      state.loading = false;
      state.items = action.payload.map(String); // Lista real del servidor
      state.products = state.products.filter(p => state.items.includes(p._id));
    });
    builder.addCase(toggleFavorite.rejected, (state, action) => {
      state.loading = false;
      state.items = flip(state.items, action.meta.arg); // deshacer
      state.error = action.payload as string || 'Error toggling favorite';
    });
  },
});

export default favoritesSlice.reducer;
