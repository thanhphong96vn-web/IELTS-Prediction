import { Container } from "@/shared/ui";
import Image from "next/image";
import Link from "next/link";
import { Button } from "antd";
import { ROUTES } from "@/shared/routes";

export const HeroBanner = () => {
  return (
    <div
      className="relative overflow-hidden py-12 md:py-20"
      style={{
        background:
          "linear-gradient(to bottom right, #fbfbfe 0%, #f3f4f6 50%, #e0e7ff 100%)",
      }}
    >
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Pink shape behind woman's head */}
        <div
          className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(251, 207, 232, 0.6) 0%, rgba(244, 114, 182, 0.4) 100%)",
          }}
        ></div>
        {/* Light blue shape upper right */}
        <div
          className="absolute top-1/3 right-1/6 w-72 h-72 rounded-full blur-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(191, 219, 254, 0.5) 0%, rgba(147, 197, 253, 0.3) 100%)",
          }}
        ></div>
        {/* Gradient bottom right */}
        <div
          className="absolute bottom-0 right-0 w-full h-1/2"
          style={{
            background:
              "linear-gradient(to top, rgba(224, 231, 255, 0.3) 0%, transparent 100%)",
          }}
        ></div>
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Side - Content */}
          <div className="w-full lg:w-7/12 space-y-6 relative">
            {/* Decorative Color Shape Above Trustpilot */}
            <div className="absolute -top-4 -right-4 w-32 h-32 opacity-30 pointer-events-none">
              <div
                className="w-full h-full rounded-full blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(167, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.3) 100%)",
                }}
              ></div>
            </div>

            {/* Trustpilot Rating */}
            <div className="flex items-center gap-3 relative z-10">
              <Image
                src="/img-admin/o-trustpilot.png"
                alt="Trustpilot"
                width={220}
                height={26}
                unoptimized
                className="object-contain"
              />
              <span
                className="text-base font-medium"
                style={{ color: "#22c55e" }}
              >
                Excellent 4.9 out of 5
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span style={{ color: "#374151" }}>Education Is The Best </span>
              <span style={{ color: "#374151" }}>Key </span>
              <span style={{ color: "#2563eb" }}>Success </span>
              <span style={{ color: "#a855f7" }}>In Life</span>
            </h1>

            {/* Description */}
            <p
              className="text-xl md:text-2xl leading-relaxed"
              style={{ color: "#22c55e" }}
            >
              Amet minim mollit non deserunt ullamco est sit aliqua dolor do
              amet sint.{" "}
              <span className="font-medium">Velit officia consequat.</span>
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href={ROUTES.REGISTER}>
                <Button
                  type="primary"
                  size="large"
                  className="h-12 px-8 rounded-lg text-base font-medium border-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    Get Started
                    <span className="material-symbols-rounded">
                      arrow_forward
                    </span>
                  </span>
                </Button>
              </Link>
              <Button
                size="large"
                className="h-12 px-8 rounded-lg text-base font-medium border-2 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  borderColor: "#374151",
                  color: "#374151",
                }}
              >
                <span className="flex items-center gap-2">
                  Watch Video
                  <span className="material-symbols-rounded text-lg">
                    play_arrow
                  </span>
                </span>
              </Button>
            </div>
          </div>

          {/* Right Side - Banner Image with Overlays */}
          <div className="w-full lg:w-5/12 relative">
            <div className="relative">
              {/* Background shapes behind image */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Pink shape behind head */}
                <div
                  className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-2xl opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(251, 207, 232, 0.8) 0%, rgba(244, 114, 182, 0.6) 100%)",
                  }}
                ></div>
                {/* Light blue shape */}
                <div
                  className="absolute top-1/3 right-1/6 w-56 h-56 rounded-full blur-2xl opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(191, 219, 254, 0.7) 0%, rgba(147, 197, 253, 0.5) 100%)",
                  }}
                ></div>
              </div>

              {/* Main Banner Image */}
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <Image
                    src="/img-admin/o-banner.png"
                    alt="Banner"
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Feature Card 1 - Top Right */}
                <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-5 flex items-center gap-3 animate-float">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/img-admin/o-icon-1.png"
                      alt="Icon"
                      width={48}
                      height={48}
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h6 className="font-bold text-base text-gray-900">Your</h6>
                    <p className="text-sm" style={{ color: "#ec4899" }}>
                      Admission Complete
                    </p>
                  </div>
                </div>

                {/* Enrolled Card - Middle Left */}
                <div className="absolute bottom-1/4 left-0 bg-white rounded-xl shadow-lg p-5 animate-float-delayed">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                      <Image
                        src="/img-admin/o-icon-2.png"
                        alt="Icon"
                        width={48}
                        height={48}
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h6 className="font-bold text-xl text-gray-900">36k+</h6>
                      <p className="text-sm" style={{ color: "#22c55e" }}>
                        Enrolled Students
                      </p>
                    </div>
                  </div>
                  {/* Profile Avatars */}
                  <div className="flex -space-x-2">
                    {[
                      "/img-admin/art-stu-2.png",
                      "/img-admin/art-stu-1.png",
                      "/img-admin/art-stu-3.png",
                      "/img-admin/i-team.png",
                    ].map((src, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white overflow-hidden relative flex-shrink-0"
                      >
                        <Image
                          src={src}
                          alt={`Student ${i + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Card 2 - Bottom Right */}
                <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-5 flex items-center gap-3 animate-float-delayed-2">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/img-admin/o-icon-3.png"
                      alt="Icon"
                      width={48}
                      height={48}
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h6 className="font-bold text-xl text-gray-900">99%</h6>
                    <p className="text-sm" style={{ color: "#22c55e" }}>
                      Satisfied
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative Shape */}
              <div
                className="absolute top-1/2 left-1/4 w-24 h-24"
                style={{
                  filter: "drop-shadow(0 0 10px rgba(217, 74, 86, 0.4))",
                }}
              >
                <div
                  className="w-full h-full relative rounded-full"
                  style={{
                    backgroundColor: "#d94a56",
                    opacity: 0.15,
                    mixBlendMode: "multiply",
                  }}
                />
                <div className="absolute inset-0">
                  <Image
                    src="/img-admin/o-shape-1.png"
                    alt="Shape"
                    fill
                    unoptimized
                    className="object-contain"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(27%) sepia(92%) saturate(1352%) hue-rotate(326deg) brightness(85%) contrast(85%)",
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float-delayed-2 {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};
