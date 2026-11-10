import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/authSlice';
import productReducer from './slices/product/productSlice';
// import chatReducer from './slices/chat/chatSlice'; // CHAT (Socket.IO): desactivado
import userReducer from './slices/user/user';
// CARRITO: desactivado por ahora
// import cartReducer from './slices/cart/cartSlice'
import favoriteReducer from './slices/favorite/favoriteSlice';
import otherUserReducer from './slices/otherUser/otherUser';
import locationReducer from './slices/location/locationSlice';
import notificationReducer from './slices/notification/notificationSlice';
import inboxReducer from './slices/inbox/inboxSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    // chats: chatReducer, // CHAT (Socket.IO): desactivado
    user: userReducer,
    otherUser: otherUserReducer,
    // cart: cartReducer, // CARRITO: desactivado por ahora
    favorite: favoriteReducer,
    location: locationReducer,
    notifications: notificationReducer,
    inbox: inboxReducer,
  },
});

/* Tipos globales */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;