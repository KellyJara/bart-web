import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import {
  AuthResponse, LoginPayload, SignupPayload, SignupResponse, VerifyEmailPayload, AuthState, EMAIL_NOT_VERIFIED,
} from '../../types/auth.types';
import { saveToken, removeToken, getToken, saveUserId, getUserId, removeUserId } from './authStorage';

/* ---------- LOGIN ---------- */
export const login = createAsyncThunk<AuthResponse, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }, thunkAPI) => {
    try {


      const res = await api.post('/auth/signin', {
        email,
        password,
      });


      saveToken(res.data.token);
      saveUserId(res.data.userId);

      return res.data;

    } catch (err: any) {

      // Solo el estado y el mensaje: el error completo incluye la petición con la contraseña
      console.log('Error al iniciar sesión:', err?.response?.status ?? '', err?.response?.data?.message ?? err?.message);

      // Contraseña correcta pero correo sin verificar: la pantalla abre la verificación
      if (err?.response?.data?.code === EMAIL_NOT_VERIFIED) {
        return thunkAPI.rejectWithValue(EMAIL_NOT_VERIFIED);
      }

      return thunkAPI.rejectWithValue(
        err?.response?.data?.message ||
        err?.message ||
        'Error al iniciar sesión'
      );
    }
  }
);

/* ---------- SIGNUP ---------- */
// Crea la cuenta (con su WhatsApp, sin verificarlo) y el backend envía un PIN al correo. La sesión se inicia en verifyEmail.
export const signup = createAsyncThunk<SignupResponse, SignupPayload, { rejectValue: string }>(
  'auth/signup',
  async ({ username, email, whatsapp, password }, thunkAPI) => {
    try {
      const response = await api.post<SignupResponse>('/auth/signup/', { username, email, whatsapp, password });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error al registrarse');
    }
  }
);

/* ---------- VERIFICAR CORREO (PIN) ---------- */
export const verifyEmail = createAsyncThunk<AuthResponse, VerifyEmailPayload, { rejectValue: string }>(
  'auth/verifyEmail',
  async ({ email, pin }, thunkAPI) => {
    try {
      const response = await api.post<AuthResponse>('/auth/verify-email', { email, pin });
      saveToken(response.data.token);
      saveUserId(response.data.userId);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'No se pudo verificar el código');
    }
  }
);

/* ---------- OLVIDÉ MI CONTRASEÑA: poner la nueva (paso final) ---------- */
// resetToken lo da /auth/verify-reset-code cuando el código del correo es correcto.
// Al cambiarla queda con sesión iniciada, igual que al verificar el correo.
export const resetPassword = createAsyncThunk<
  AuthResponse,
  { resetToken: string; newPassword: string },
  { rejectValue: string }
>(
  'auth/resetPassword',
  async ({ resetToken, newPassword }, thunkAPI) => {
    try {
      const response = await api.post<AuthResponse>('/auth/reset-password', { resetToken, newPassword });
      saveToken(response.data.token);
      saveUserId(response.data.userId);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'No se pudo cambiar la contraseña');
    }
  }
);

/* ---------- INITIAL STATE ---------- */
// En la web la sesión guardada se lee al cargar la página (localStorage es síncrono)
const initialState: AuthState = {
  token: getToken(),
  roles: [],
  userId: getUserId(),
  loading: false,
  error: null,
};

/* ---------- SLICE ---------- */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Al entrar a Login/Registro no se muestra el error de la pantalla anterior
    clearAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.token = null;
      state.roles = [];
      state.userId = null;
      removeToken(); // <-- borrar token en logout
      removeUserId();
    },
  },
  extraReducers: (builder) => {
    builder
      /* LOGIN */
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.roles = action.payload.roles;
        state.userId = action.payload.userId;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        // Correo sin verificar no es un error a mostrar: se abre la pantalla del PIN
        state.error = action.payload === EMAIL_NOT_VERIFIED ? null : action.payload ?? 'unknown error';
      })
      /* SIGNUP */
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'unknown error';
      })
      /* VERIFICAR CORREO: inicia sesión igual que el login */
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.roles = action.payload.roles;
        state.userId = action.payload.userId;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'unknown error';
      })
      /* OLVIDÉ MI CONTRASEÑA: inicia sesión igual que el login */
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.roles = action.payload.roles;
        state.userId = action.payload.userId;
      })
      .addCase(resetPassword.rejected, (state) => {
        // El error se muestra en la pantalla de cambiar contraseña, no en el Login
        state.loading = false;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
