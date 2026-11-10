import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { logout } from '../auth/authSlice';

// Aviso de la campanita (ver backend: models/Notification.js)
export interface InboxNotification {
  _id: string;
  type: 'message' | 'request' | 'review';
  title: string;
  body: string;
  data: {
    type?: string;
    event?: string; // offer_received, application_received, accepted, rejected...
    chatId?: string;
    senderName?: string;
    productId?: string;
    sellerId?: string; // reseñas
    role?: 'owner' | 'requester';
  };
  count: number; // mensajes agrupados del mismo chat
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InboxState {
  items: InboxNotification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
}

const initialState: InboxState = {
  items: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,
};

const PAGE_SIZE = 30;

export const fetchUnreadCount = createAsyncThunk<number>(
  'inbox/fetchUnreadCount',
  async () => {
    const res = await api.get<{ count: number }>('/notifications/inbox/unread-count');
    return res.data.count;
  }
);

// before: fecha del último aviso cargado, para traer los anteriores
export const fetchInbox = createAsyncThunk<InboxNotification[], { before?: string } | undefined>(
  'inbox/fetchInbox',
  async (args) => {
    const res = await api.get<InboxNotification[]>('/notifications/inbox', {
      params: args?.before ? { before: args.before } : undefined,
    });
    return res.data;
  }
);

export const markNotificationRead = createAsyncThunk<string, string>(
  'inbox/markRead',
  async (id) => {
    await api.patch(`/notifications/inbox/${id}/read`);
    return id;
  }
);

export const markAllNotificationsRead = createAsyncThunk<void>(
  'inbox/markAllRead',
  async () => {
    await api.patch('/notifications/inbox/read-all');
  }
);

const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => initialState)

      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      .addCase(fetchInbox.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInbox.fulfilled, (state, action) => {
        state.loading = false;
        const isNextPage = !!action.meta.arg?.before;
        state.items = isNextPage ? [...state.items, ...action.payload] : action.payload;
        state.hasMore = action.payload.length === PAGE_SIZE;
      })
      .addCase(fetchInbox.rejected, (state) => {
        state.loading = false;
      })

      // Actualización optimista: el globo baja al instante
      .addCase(markNotificationRead.pending, (state, action) => {
        const item = state.items.find(n => n._id === action.meta.arg);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.items.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      });
  },
});

export default inboxSlice.reducer;
