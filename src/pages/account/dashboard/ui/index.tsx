import { TargetScore, PracticeHistory } from "@/widgets";
import { MyProfileLayout } from "@/widgets/layouts";

export const PageDashboard = () => {
  return (
    <div className="space-y-6">
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
