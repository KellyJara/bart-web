import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from './redux/hooks';
import { selectIsAdmin, selectIsConnected } from './redux/slices/auth/authSelectors';
import { rememberReturnTo } from './utils/authGate';
import Layout from './components/Layout';
import { DialogHost } from './components/ui';

import LoginScreen from './screens/AuthModule/LoginScreen';
import SignUpScreen from './screens/AuthModule/SignUpScreen';
import VerifyEmailScreen from './screens/AuthModule/VerifyEmailScreen';
import ForgotPasswordScreen from './screens/AuthModule/ForgotPasswordScreen';
import ProductsScreen from './screens/ProductModule/ProductsScreen';
import ProductDetailScreen from './screens/ProductModule/ProductDetailScreen';
import RegisterProductScreen from './screens/ProductModule/RegisterProductScreen';
import EditProductScreen from './screens/ProductModule/EditProductScreen';
import MyProductsScreen from './screens/ProductModule/MyProductsScreen';
import MyContactsScreen from './screens/ProductModule/MyContactsScreen';
import ProductContactsScreen from './screens/ProductModule/ProductContactsScreen';
import EditProfileScreen from './screens/ProfileModule/EditProfileScreen';
import ChangePasswordScreen from './screens/ProfileModule/ChangePasswordScreen';
import AdminReportScreen from './screens/AdminModule/AdminReportScreen';
import NotificationSettingsScreen from './screens/ProfileModule/NotificationSettingsScreen';
import NotificationsScreen from './screens/ProfileModule/NotificationsScreen';
import SellerProfileScreen from './screens/ProfileModule/SellerProfileScreen';
import SellerReviewsScreen from './screens/ProfileModule/SellerReviewsScreen';
import SupportScreen from './screens/ProfileModule/SupportScreen';

// Páginas que requieren sesión: sin sesión van al Login y después vuelven aquí
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const isConnected = useAppSelector(selectIsConnected);
  const location = useLocation();
  if (!isConnected) {
    rememberReturnTo(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RedirectToContacts = () => {
  const { productId } = useParams();
  return <Navigate to={`/products/${productId}/contacts`} replace />;
};

// Informe: solo administradores (los demás vuelven al inicio)
const RequireAdmin = ({ children }: { children: React.ReactElement }) => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const profileLoaded = useAppSelector(state => !!state.user.currentUser);
  // Al recargar la página los roles llegan con el perfil: esperar antes de decidir
  if (!isAdmin && !profileLoaded) return null;
  return isAdmin ? children : <Navigate to="/" replace />;
};

const App = () => (
  <>
    <Routes>
      {/* La web abre en los productos; Login y Registro se muestran solo cuando
          el usuario intenta una acción que requiere sesión */}
      <Route element={<Layout />}>
        <Route index element={<ProductsScreen />} />
        {/* /p/:id es el enlace que se comparte */}
        <Route path="product/:productId" element={<ProductDetailScreen />} />
        <Route path="p/:productId" element={<ProductDetailScreen />} />
        <Route path="seller/:sellerId" element={<SellerProfileScreen />} />
        <Route path="seller/:sellerId/reviews" element={<SellerReviewsScreen />} />

        <Route path="products/new" element={<RequireAuth><RegisterProductScreen /></RequireAuth>} />
        <Route path="products/:id/edit" element={<RequireAuth><EditProductScreen /></RequireAuth>} />
        {/* Enlaces viejos de "ver ofertas": ahora es la lista de contactos por WhatsApp */}
        <Route path="products/:productId/requests" element={<RequireAuth><RedirectToContacts /></RequireAuth>} />
        <Route path="products/:productId/contacts" element={<RequireAuth><ProductContactsScreen /></RequireAuth>} />
        <Route path="my-products" element={<RequireAuth><MyProductsScreen /></RequireAuth>} />
        <Route path="my-contacts" element={<RequireAuth><MyContactsScreen /></RequireAuth>} />
        <Route path="my-requests" element={<Navigate to="/my-contacts" replace />} />
        <Route path="admin/report" element={<RequireAuth><RequireAdmin><AdminReportScreen /></RequireAdmin></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><EditProfileScreen /></RequireAuth>} />
        <Route path="profile/password" element={<RequireAuth><ChangePasswordScreen /></RequireAuth>} />
        <Route path="settings/notifications" element={<RequireAuth><NotificationSettingsScreen /></RequireAuth>} />
        <Route path="notifications" element={<RequireAuth><NotificationsScreen /></RequireAuth>} />
        <Route path="support" element={<RequireAuth><SupportScreen /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="login" element={<LoginScreen />} />
      <Route path="signup" element={<SignUpScreen />} />
      <Route path="verify-email" element={<VerifyEmailScreen />} />
      <Route path="forgot-password" element={<ForgotPasswordScreen />} />
    </Routes>
    <DialogHost />
  </>
);

export default App;
