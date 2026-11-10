import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { logout } from '../auth/authSlice';
import { Coords } from '../../../utils/location';

export interface NotificationSettings {
  messages: boolean;        // mensajes nuevos de chat
  requests: boolean;        // interesados y ofertas en mis productos
  nearbyProducts: boolean;  // productos nuevos cerca
  nearbyRadiusKm: number;
  nearbyOnlyFree: boolean;  // solo productos gratis
  hasLocation: boolean;     // el backend ya tiene la ubicación aproximada
}

export type NotificationSettingsUpdate =
  Partial<Omit<NotificationSettings, 'hasLocation'>> & { location?: Coords };

interface NotificationState {
  settings: NotificationSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  settings: null,
  loading: false,
  error: null,
};

export const fetchNotificationSettings = createAsyncThunk<NotificationSettings, void, { rejectValue: string }>(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<NotificationSettings>('/notifications/settings');
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk<
  NotificationSettings,
  NotificationSettingsUpdate,
  { rejectValue: string }
>(
  'notifications/updateSettings',
  async (update, { rejectWithValue }) => {
    try {
      const res = await api.put<NotificationSettings>('/notifications/settings', update);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => initialState)

      .addCase(fetchNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Error';
      })

      // Actualización optimista: el switch cambia al instante
      .addCase(updateNotificationSettings.pending, (state, action) => {
        const { location, ...changes } = action.meta.arg;
        if (state.settings) {
          state.settings = { ...state.settings, ...changes };
        }
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.error = action.payload ?? 'Error';
      });
  },
});

export default notificationSlice.reducer;
