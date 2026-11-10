import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Coords,
  getCurrentLocation,
  getLocationConsent,
  getLocationIfAllowed,
  LocationError,
  LocationErrorReason,
  saveLocationConsent,
} from '../../../utils/location';

// idle: todavía no se revisó | needs_consent: el usuario no ha aceptado usar su ubicación
export type LocationStatus = 'idle' | 'needs_consent' | 'loading' | 'granted' | LocationErrorReason;
export type ListingType = 'all' | 'sale' | 'gift';

interface LocationState {
  coords: Coords | null;
  status: LocationStatus;
  consentAsked: boolean; // ya se le mostró el aviso de ubicación (aceptó o dijo "ahora no")
  radiusKm: number | null; // null = sin límite (todos los productos)
  listingType: ListingType;
  category: string | null; // null = todas
}

const initialState: LocationState = {
  coords: null,
  status: 'idle',
  consentAsked: false,
  radiusKm: 10,
  listingType: 'all',
  category: null,
};

const toReason = (err: unknown): LocationErrorReason =>
  err instanceof LocationError ? err.reason : 'unavailable';

/**
 * Al abrir la app: NO muestra ningún diálogo.
 * Solo lee la ubicación si el usuario ya aceptó antes y el permiso del sistema sigue activo.
 */
export const initLocation = createAsyncThunk<
  { consent: 'accepted' | 'declined' | null; coords?: Coords; error?: LocationErrorReason }
>(
  'location/init',
  async () => {
    const consent = await getLocationConsent();
    if (consent !== 'accepted') return { consent };
    try {
      return { consent, coords: await getLocationIfAllowed() };
    } catch (err) {
      return { consent, error: toReason(err) };
    }
  }
);

/**
 * El usuario aceptó usar su ubicación (tocó "Permitir" o "Usar mi ubicación"):
 * se guarda su consentimiento, se pide el permiso del sistema y se lee.
 */
export const requestLocation = createAsyncThunk<Coords, void, { rejectValue: LocationErrorReason }>(
  'location/request',
  async (_, { rejectWithValue }) => {
    await saveLocationConsent('accepted');
    try {
      return await getCurrentLocation();
    } catch (err) {
      return rejectWithValue(toReason(err));
    }
  }
);

// El usuario dijo "Ahora no": no se lee nada y no se vuelve a preguntar solo
export const declineLocation = createAsyncThunk('location/decline', async () => {
  await saveLocationConsent('declined');
});

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setRadius: (state, action: PayloadAction<number | null>) => {
      state.radiusKm = action.payload;
    },
    setListingType: (state, action: PayloadAction<ListingType>) => {
      state.listingType = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string | null>) => {
      state.category = action.payload;
    },
    // Se mostró el aviso (para no mostrarlo dos veces mientras el usuario responde)
    markConsentAsked: (state) => {
      state.consentAsked = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initLocation.fulfilled, (state, action) => {
        const { consent, coords, error } = action.payload;
        state.consentAsked = consent !== null;
        if (consent !== 'accepted') {
          state.status = 'needs_consent';
        } else if (coords) {
          state.status = 'granted';
          state.coords = coords;
        } else {
          state.status = error ?? 'unavailable';
        }
      })
      .addCase(initLocation.rejected, (state) => {
        state.status = 'needs_consent';
      })

      .addCase(requestLocation.pending, (state) => {
        state.status = 'loading';
        state.consentAsked = true;
      })
      .addCase(requestLocation.fulfilled, (state, action) => {
        state.status = 'granted';
        state.coords = action.payload;
      })
      .addCase(requestLocation.rejected, (state, action) => {
        state.status = action.payload ?? 'unavailable';
      })

      .addCase(declineLocation.pending, (state) => {
        state.status = 'needs_consent';
        state.consentAsked = true;
      });
  },
});

export const { setRadius, setListingType, setCategoryFilter, markConsentAsked } = locationSlice.actions;
export default locationSlice.reducer;
