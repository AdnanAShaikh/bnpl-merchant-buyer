import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import LoginScreen from "./screens/LoginScreen";
import RegisterAsMerchantScreen from "./screens/RegisterAsMerchantScreen";
import RegisterAsBuyerScreen from "./screens/RegisterAsBuyerScreen";
import BuyerDashboardScreen from "./screens/buyer/BuyerDashboardScreen";
import BuyerWalletScreen from "./screens/buyer/BuyerWalletScreen";
import BuyerOrdersListingScreen from "./screens/buyer/BuyerOrdersListingScreen";
import MerchantDashboardScreen from "./screens/merchant/MerchantDashboardScreen";
import MerchantWalletScreen from "./screens/merchant/MerchantWalletScreen";
import MerchantBuyersListingScreen from "./screens/merchant/MerchantBuyersListingScreen";
import MerchantOrdersListingScreen from "./screens/merchant/MerchantOrdersListingScreen";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { logoutUser, selectAuthUser, setAuthUser } from "./store/slices/authSlice";
import { toast } from "react-toastify";
import { useEffect } from "react";
import ForgotPassword from "./screens/ForgotPassword";

function App() {
  const authUser = useAppSelector(selectAuthUser);
  const location = useLocation();
  const dispatch = useAppDispatch();
  console.log(authUser)

useEffect(() => {

  if (!authUser) return;

  const verify = async () => {

    try {

      // ─────────────────────────────────────────
      // VERIFY ACCESS TOKEN
      // ─────────────────────────────────────────

      let res = await fetch(
        "/api/auth/verify/bnplToken",
        {
          credentials: "include",
        }
      );

      // ─────────────────────────────────────────
      // ACCESS TOKEN EXPIRED
      // ─────────────────────────────────────────

      if (res.status === 401) {
        // try refresh
        const refreshRes = await fetch(
          "/api/auth/refresh/bnplToken",
          {
            credentials: "include",
          }
        );
        
        // refresh failed
        if (!refreshRes.ok) {

          dispatch(logoutUser());

          toast.error(
            "Session expired. Please login again."
          );

          return;
        }

        // retry verify after refresh
        res = await fetch(
          "/api/auth/verify/bnplToken",
          {
            credentials: "include",
          }
        );
      }

      // ─────────────────────────────────────────
      // VERIFIED
      // ─────────────────────────────────────────

      if (res.ok) {

        const data = await res.json();

        dispatch(
          setAuthUser(data.user)
        );

      } else {

        dispatch(logoutUser());

        toast.error(
          "Session expired. Please login again."
        );
      }

    } catch (error) {

      dispatch(logoutUser());

      toast.error(
        "System crashed. Please login again."
      );
    }
  };

  verify();

}, [location.pathname]);


  return (
    <>
    <Routes>
      <Route path="/forgot-password" element={<ForgotPassword />} />

    <Route
        path="/"
        element={authUser ? authUser?.role === 'MERCHANT' ?  
                              <Navigate to="/merchant/dashboard" replace /> 
                              : <Navigate to="/buyer/dashboard" replace />  
                          : <LoginScreen />}
      />      
      
      
      <Route path="/register/merchant" element={<RegisterAsMerchantScreen />} />
      <Route path="/register/buyer" element={<RegisterAsBuyerScreen />} />

      {authUser ? (
        <>
          {/* Buyer Routes */}
          {authUser.role === "BUYER" && (
            <>
              <Route path="/buyer/dashboard" element={<BuyerDashboardScreen />} />
              <Route path="/buyer/wallet" element={<BuyerWalletScreen />} />
              <Route path="/buyer/orders" element={<BuyerOrdersListingScreen />} />

              {/* Prevent buyer from accessing merchant routes */}
              <Route path="/merchant/*" element={<Navigate to="/buyer/dashboard" replace />} />
            </>
          )}

          {/* Merchant Routes */}
          {authUser.role === "MERCHANT" && (
            <>
              <Route path="/merchant/dashboard" element={<MerchantDashboardScreen />} />
              <Route path="/merchant/wallet" element={<MerchantWalletScreen />} />
              <Route path="/merchant/buyers" element={<MerchantBuyersListingScreen />} />
              <Route path="/merchant/orders" element={<MerchantOrdersListingScreen />} />

              {/* Prevent merchant from accessing buyer routes */}
              <Route path="/buyer/*" element={<Navigate to="/merchant/dashboard" replace />} />
            </>
          )}
        </>
      ) : (
        <>
          {/* Not logged in */}
          <Route path="/buyer/*" element={<Navigate to="/" replace />} />
          <Route path="/merchant/*" element={<Navigate to="/" replace />} />
        </>
      )}

    </Routes>
    </>
  )
}

export default App
