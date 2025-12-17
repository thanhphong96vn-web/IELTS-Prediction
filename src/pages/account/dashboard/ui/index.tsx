import { TargetScore, PracticeHistory } from "@/widgets";
import { MyProfileLayout } from "@/widgets/layouts";

export const PageDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="rounded-lg border"
          classNames={{
            body: "p-6! min-h-[180px] flex flex-col justify-center",
          }}
          style={{
            borderColor: "#93C5FD",
            background:
              "linear-gradient(135deg, rgba(219, 234, 254, 0.8) 0%, rgba(221, 214, 254, 0.8) 100%)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "rgba(147, 197, 253, 0.3)",
              }}
            >
              <span
                className="material-symbols-rounded text-4xl"
                style={{ color: "#2563EB" }}
              >
                menu_book
              </span>
            </div>
            <p className="text-5xl font-bold mb-2" style={{ color: "#1E40AF" }}>
              30
            </p>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#60A5FA" }}
            >
              ENROLLED COURSES
            </p>
            <p className="text-xs mt-2 text-gray-600">
              Tổng thời gian luyện đề
            </p>
          </div>
        </Card>

        <Card
          className="rounded-lg border"
          classNames={{
            body: "p-6! min-h-[180px] flex flex-col justify-center",
          }}
          style={{
            borderColor: "#C4B5FD",
            background:
              "linear-gradient(135deg, rgba(221, 214, 254, 0.8) 0%, rgba(237, 233, 254, 0.8) 100%)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "rgba(196, 181, 253, 0.3)",
              }}
            >
              <span
                className="material-symbols-rounded text-4xl"
                style={{ color: "#7C3AED" }}
              >
                computer
              </span>
            </div>
            <p className="text-5xl font-bold mb-2" style={{ color: "#6D28D9" }}>
              10
            </p>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#A78BFA" }}
            >
              ACTIVE COURSES
            </p>
            <p className="text-xs mt-2 text-gray-600">Tổng số Test đã làm</p>
          </div>
        </Card>

        <Card
          className="rounded-lg"
          classNames={{
            body: "p-6! min-h-[180px] flex flex-col justify-center",
          }}
          style={{
            borderWidth: "3px",
            borderColor: "#FCD34D",
            background:
              "linear-gradient(135deg, rgba(254, 243, 199, 0.8) 0%, rgba(254, 249, 195, 0.8) 100%)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "rgba(252, 211, 77, 0.3)",
              }}
            >
              <span
                className="material-symbols-rounded text-4xl"
                style={{ color: "#92400E" }}
              >
                military_tech
              </span>
            </div>
            <p className="text-5xl font-bold mb-2" style={{ color: "#78350F" }}>
              7
            </p>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#B45309" }}
            >
              COMPLETED COURSES
            </p>
            <p className="text-xs mt-2 text-gray-600">Huy hiệu đạt được</p>
          </div>
        </Card>
      </div> */}

      {/* Target Score and Exam Date */}
      <TargetScore />

      {/* Practice History Section */}
      <section className="space-y-6 mt-6">
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          Practice History
        </h3>
        <PracticeHistory />
      </section>
    </div>
  );
};

PageDashboard.Layout = MyProfileLayout;
