// ieltspredictiontes\src\widgets\layouts\base\index.tsx (Bản cuối cùng)

import { useAppContext, useAuth } from "@/appx/providers";
import { FloatingButton, Footer, SaleNotification } from "./ui";
import { Header } from "./ui/header";
import { ClipboardEvent, MouseEvent, useCallback, useEffect, useState } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { useDeviceID } from "@/shared/hooks";
import { toast } from "react-toastify";

// ========================================================================
// === BƯỚC 1: DI CHUYỂN TOÀN BỘ LOGIC "THẰNG GÁC CỔNG" VỀ ĐÂY ===
// ========================================================================
const CHECK_DEVICE_QUERY = gql`
  query CHECK($deviceId: String!, $deviceType: String!) {
    checkDevice(deviceId: $deviceId, deviceType: $deviceType)
  }
`;

const DeviceChecker = () => {
  const { signOut } = useAuth();
  const getDeviceID = useDeviceID((state) => state.getDeviceID);
  const getDeviceType = useDeviceID((state) => state.getDeviceType);
  const [deviceId, setDeviceId] = useState<string>("");

  const [checkMutation, { data }] = useLazyQuery(CHECK_DEVICE_QUERY, {
    variables: { deviceId, deviceType: getDeviceType() },
    context: { authRequired: true },
    fetchPolicy: "no-cache",
    // Lỗi sẽ được bắt ở đây thay vì làm sập trang
    onError: (error) => {
      console.error("CheckDevice Error:", error.message);
    }
  });

  useEffect(() => {
    getDeviceID().then((id) => setDeviceId(id));
  }, [getDeviceID]);

  const checkBlur = useCallback(() => {
    if (deviceId) {
      checkMutation();
    }
  }, [checkMutation, deviceId]);

  useEffect(() => {
    if (deviceId) {
      checkMutation(); // Kiểm tra khi component được tải
      window.addEventListener("focus", checkBlur);
      return () => {
        window.removeEventListener("focus", checkBlur);
      };
    }
  }, [checkBlur, deviceId, checkMutation]);

  useEffect(() => {
    if (data && !data.checkDevice) {
      toast.error("Your account has been logged in from another device, you will be logged out.");
      signOut();
    }
  }, [data, signOut]);

  return null; // Component này không render ra giao diện
}

export const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  const { masterData } = useAppContext();

  const handleCopy = (event: ClipboardEvent<HTMLElement>) => {
    if (
      masterData?.websiteOptions.websiteOptionsFields.generalSettings
        .preventCopy
    ) {
      event.preventDefault();
    }
  };

  const handleContextMenu = (event: MouseEvent<HTMLElement>) => {
    if (
      masterData?.websiteOptions.websiteOptionsFields.generalSettings
        .preventCopy
    ) {
      event.preventDefault();
    }
  };

  return (
    <>
      {/* ======================================================================== */}
      {/* === BƯỚC 2: ĐẶT "THẰNG GÁC CỔNG" VÀO ĐÚNG CHỖ === */}
      {/* === Nó sẽ chỉ chạy trên các trang đã đăng nhập, không còn gây lỗi ở trang redirect nữa === */}
      {/* ======================================================================== */}
      <DeviceChecker />
      <Header />
      <main onCopy={handleCopy} onContextMenu={handleContextMenu}>
        {children}
      </main>
      <Footer />
      <SaleNotification />
      <FloatingButton />
    </>
  );
};