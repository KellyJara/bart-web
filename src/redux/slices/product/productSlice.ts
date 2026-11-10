import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, CreateProductPayload, updateProductPayload, ProductFilters } from '../../types/product.type';
import { productService } from '../../services/productService';
import { toggleFavorite } from '../favorite/favoriteSlice';

interface ProductState {
  items: Product[];
  // Listado de la pantalla principal (con filtros de cercanía/tipo).
  // Va separado de items para no afectar "Mis productos".
  feed: Product[];
  feedLoading: boolean;
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  items: [],
  feed: [],
  feedLoading: false,
  selectedProduct: null,
  loading: false,
  error: null
};

// THUNKS
export const fetchProducts = createAsyncThunk<Product[]>(
  'products/fetchAll',
  async () => {
    const res = await productService.getAll();
    return res.data;
  }
);

export const fetchFeed = createAsyncThunk<Product[], ProductFilters | undefined>(
  'products/fetchFeed',
  async (filters) => {
    const res = await productService.getAll(filters);
    return res.data;
  }
);

export const fetchProductById = createAsyncThunk<Product, string>(
  'products/fetchById',
  async (id) => {
    const res = await productService.getById(id);
    return res.data;
  }
);

export const createProduct = createAsyncThunk<
  Product,
  CreateProductPayload
>(
  'products/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await productService.create(payload);
      return res.data;
    } catch (error: any) {
      // Mensaje del backend (p. ej. imagen rechazada por contenido inapropiado)
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const updateProduct = createAsyncThunk<
  Product,
  { id: string; product: updateProductPayload }
>(
  'products/update',
  async ({ id, product }, { rejectWithValue }) => {
    try {
      const res = await productService.update(id, product);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteProduct = createAsyncThunk<string, string>(
  'products/delete',
  async (id) => {
    await productService.remove(id);
    return id;
  }
);

// SLICE
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH ALL
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error';
      })

      // FEED
      .addCase(fetchFeed.pending, (state) => {
        state.feedLoading = true;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.feedLoading = false;
        state.feed = action.payload;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feedLoading = false;
        state.error = action.error.message ?? 'Error';
      })

      // FETCH BY ID
      .addCase(fetchProductById.pending, (state) => {
       state.loading = true;
       state.selectedProduct = null;
       })

      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })

      .addCase(fetchProductById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Error al cargar producto';
      })

      // CREATE
      .addCase(createProduct.fulfilled, (state, action) => {
        // El recién publicado va arriba (las listas van de más nuevo a más viejo)
        state.items.unshift(action.payload);
      })

      // UPDATE
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        const feedIndex = state.feed.findIndex(p => p._id === action.payload._id);
        if (feedIndex !== -1) {
          // conservar la distancia calculada en la búsqueda
          state.feed[feedIndex] = { ...action.payload, distanceKm: state.feed[feedIndex].distanceKm };
        }
      })

      // FAVORITOS: ajustar el contador del producto sin recargar
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const productId = action.meta.arg;
        const added = action.payload.map(String).includes(productId);
        const adjust = (p?: Product | null) => {
          if (p && p._id === productId) {
            p.favoritesCount = Math.max(0, (p.favoritesCount ?? 0) + (added ? 1 : -1));
          }
        };
        state.items.forEach(adjust);
        state.feed.forEach(adjust);
        adjust(state.selectedProduct);
      })

      // DELETE
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (p) => p._id !== action.payload
        );
        state.feed = state.feed.filter(p => p._id !== action.payload);
      });
  }
});

export default productSlice.reducer;
