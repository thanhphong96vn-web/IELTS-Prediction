import { Container } from "@/shared/ui";

const STATISTICS = [
  {
    icon: "favorite",
    value: "500+",
    label: "Learners & counting",
    bgColor: "rgba(37, 99, 235, 0.1)", // Light blue
    borderColor: "rgba(37, 99, 235, 0.2)",
    iconColor: "#2563eb",
  },
  {
    icon: "show_chart",
    value: "800+",
    label: "Courses & Video",
    bgColor: "rgba(236, 72, 153, 0.1)", // Light pink
    borderColor: "rgba(236, 72, 153, 0.2)",
    iconColor: "#ec4899",
  },
  {
    icon: "cast",
    value: "1,000+",
    label: "Certified Students",
    bgColor: "rgba(167, 85, 247, 0.1)", // Light purple
    borderColor: "rgba(167, 85, 247, 0.2)",
    iconColor: "#a855f7",
  },
  {
    icon: "map",
    value: "100+",
    label: "Certified Students",
    bgColor: "rgba(192, 38, 211, 0.1)", // Light violet/purple
    borderColor: "rgba(192, 38, 211, 0.2)",
    iconColor: "#c026d3",
  },
];

export const WhyChooseUs = () => {
  return (
    <div className="bg-white py-16 md:py-20">
      <Container>
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Subtitle */}
          <div className="flex justify-center mb-4">
            <span
              className="inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase"
              style={{
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "#2563eb",
              }}
            >
              Why Choose Us
            </span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-gray-900">
            Creating A Community Of <br /> Life Long Learners.
          </h2>

          {/* Description */}
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mt-5 mb-0">
            There are many variations of passages of the Ipsum available, but
            the majority have suffered alteration in some form, by injected
            humour.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATISTICS.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center justify-start ${
                index === 1 || index === 3 ? "mt-6 md:mt-10" : ""
              }`}
            >
              {/* Icon Circle */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 shrink-0"
                style={{
                  backgroundColor: stat.bgColor,
                  borderColor: stat.borderColor,
                }}
              >
                <span
                  className="material-symbols-rounded text-3xl"
                  style={{ color: stat.iconColor }}
                >
                  {stat.icon}
                </span>
              </div>

              {/* Number */}
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {stat.value}
              </h3>

              {/* Label */}
              <span className="text-base text-gray-600">{stat.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};
