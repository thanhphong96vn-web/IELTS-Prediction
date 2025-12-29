import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { MyProfileLayout } from "@/widgets/layouts";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { formatPrice } from "@/pages/subscription/ui/subscription-plans/pricing";
import dayjs from "dayjs";
import { CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";

const CopyButton = dynamic(() => import("./copy-button"), { ssr: false });

interface OrderData {
  orderId: string;
  amount: number;
  createdAt: string;
  paymentMethod: string;
  transferContent: string;
  status: string;
}

interface OrderReceivedPageProps {
  order: OrderData | null;
  error?: string;
}

const OrderReceivedPage = ({ order, error }: OrderReceivedPageProps) => {

  if (error || !order) {
    return (
      <div className="flex justify-center min-h-[60vh] items-center px-4">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl border border-gray-200 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 mb-4">
              Không tìm thấy đơn hàng
            </h1>
            <p className="text-gray-600 mb-8">
              {error || "Đơn hàng không tồn tại hoặc đã bị xóa."}
            </p>
            <Link
              href={ROUTES.SUBSCRIPTION}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition shadow-md hover:shadow-lg"
            >
              Trở về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayOrderId = `#${order.orderId}`;
  const displayAmount = formatPrice(order.amount);
  const displayDate = dayjs(order.createdAt).format("DD [Tháng] MM, YYYY");
  const displayMethod = order.paymentMethod;
  const displayNote = order.transferContent;

  return (
    <div className="flex justify-center min-h-[60vh] px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Đơn hàng của bạn đã được đặt thành công!
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-2xl mx-auto">
            Vui lòng <span className="font-bold text-gray-900">không tắt trình duyệt</span> cho đến khi
            nhận được <span className="font-bold text-gray-900">kết quả giao dịch</span> trên website.
            <br className="hidden sm:block" />
            <span className="block sm:inline"> Hệ thống sẽ kiểm tra và xử lý sau vào vài phút...</span>
          </p>
        </div>

        {/* Bank Transfer Section */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-green-600 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-lg px-6 py-4 text-center">
            CHUYỂN KHOẢN ĐỂ THANH TOÁN
          </div>

          <div className="p-6 space-y-4">
            {/* Bank Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Tên tài khoản" value="TRAN PHAN TIEN PHAT" />
              <InfoRow label="Số tài khoản" value="0481000847499" />
              <InfoRow label="Ngân hàng" value="Vietcombank (VCB)" />
              <InfoRow label="Số tiền" value={displayAmount.replace("đ", "vnd")} />
              <InfoRow label="Nội dung chuyển khoản" value={displayNote} className="md:col-span-2" />
              <InfoRow label="Trạng thái" value="Chờ thanh toán" className="md:col-span-2" />
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mt-6">
              <p className="text-yellow-800 font-bold text-sm leading-relaxed">
                ⚠️ VUI LÒNG NHẬP CHÍNH XÁC NỘI DUNG CHUYỂN KHOẢN ĐỂ HỆ THỐNG KIỂM TRA VÀ KÍCH HOẠT TỰ ĐỘNG
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center py-6">
              <div className="w-64 h-64 rounded-xl overflow-hidden mb-4 border-2 border-gray-200">
                <img 
                  src="/qr.png" 
                  alt="QR Code chuyển khoản" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Copy Transfer Content Button */}
              <CopyButton text={displayNote} />
            </div>

            {/* Footer Instructions */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <p className="text-center text-gray-600 text-sm leading-relaxed mx-auto max-w-[450px]">
                Sau khi hoàn tất chuyển khoản, vui lòng <span className="font-semibold">không tắt trình duyệt</span> cho đến khi nhận được
                kết quả giao dịch trên website. Xin cảm ơn!
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="font-semibold text-green-700">Đang chờ chuyển khoản</p>
              </div>
              <div className="flex justify-center pt-2">
                <a
                  href="tel:0927090848"
                  className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition text-sm"
                >
                  📞 Báo cáo sự cố: 0927090848
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <p className="text-center text-gray-600 mb-6">
            Cảm ơn bạn. Đơn hàng của bạn đã được nhận.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryBox label="Mã đơn" value={displayOrderId} />
            <SummaryBox label="Thời gian" value={displayDate} />
            <SummaryBox label="Thanh toán" value={displayAmount} />
            <SummaryBox label="Hình thức" value={displayMethod} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={ROUTES.SUBSCRIPTION}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition shadow-md hover:shadow-lg"
          >
            Trở về trang chủ
          </Link>
          <Link
            href={ROUTES.ACCOUNT.ORDER_HISTORY}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition"
          >
            Xem lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ 
  label, 
  value, 
  className = "" 
}: { 
  label: string; 
  value: string;
  className?: string;
}) => (
  <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
    <div className="text-xs uppercase text-gray-500 font-semibold mb-1 tracking-wide">
      {label}
    </div>
    <div className="text-base font-bold text-gray-900 break-all">
      {value}
    </div>
  </div>
);

const SummaryBox = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4 text-center">
    <p className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wide">
      {label}
    </p>
    <p className="text-lg font-bold text-gray-900 break-words">
      {value}
    </p>
  </div>
);

OrderReceivedPage.Layout = MyProfileLayout;

export default OrderReceivedPage;

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withAuth,
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const { orderId } = context.query;

    if (!orderId || typeof orderId !== "string") {
      return {
        props: {
          order: null,
          error: "Order ID is required",
        },
      };
    }

    try {
      const protocol = context.req.headers["x-forwarded-proto"] || "http";
      const host = context.req.headers.host || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;

      const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
        headers: {
          cookie: context.req.headers.cookie || "",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          props: {
            order: null,
            error: errorData.error || "Failed to fetch order",
          },
        };
      }

      const data = await res.json();

      if (!data.success || !data.order) {
        return {
          props: {
            order: null,
            error: "Order not found",
          },
        };
      }

      const orderFields = data.order.orderFields;

      return {
        props: {
          order: {
            orderId: data.order.orderId,
            amount: orderFields.amount,
            createdAt: orderFields.createdAt,
            paymentMethod: orderFields.paymentMethod,
            transferContent: orderFields.transferContent,
            status: orderFields.status,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching order:", error);
      return {
        props: {
          order: null,
          error: "Failed to fetch order information",
        },
      };
    }
  }
);

