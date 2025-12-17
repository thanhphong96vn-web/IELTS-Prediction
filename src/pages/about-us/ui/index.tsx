import { BaseLayout } from "@/widgets/layouts";
import { WhyChooseUs } from "@/pages/home/ui/why-choose-us";
import { Testimonials } from "@/pages/home/ui/testimonials";
import { Container } from "@/shared/ui";
import Link from "next/link";
import { AboutContent } from "./about-content";

export const PageAboutUs = () => {
  return (
    <>
      {/* Banner Section */}
      <div
        className="relative min-h-[750px] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/img-admin/bg-image-11.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        ></div>

        {/* Content */}
        <Container className="relative z-10 py-20">
          <div className="text-center">
            {/* Subtitle */}
            <div className="mb-5">
              <span
                className="inline-block px-4 py-2 rounded-md text-sm font-semibold text-white"
                style={{
                  backgroundColor: "rgba(255, 127, 80, 0.8)",
                }}
              >
                How We Work
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-10 leading-tight">
              Take Challenge for Build Your Life. <br />
              The World Most Lessons for Back to Your Life.
            </h1>

            {/* CTA Button */}
            <div className="mt-10">
              <Link href="#about-content">
                <button
                  type="button"
                  className="group relative px-8 py-4 text-base font-medium text-white rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background:
                      "linear-gradient(90deg, #2563eb 0%, #9333ea 100%)",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>More About Us</span>
                    <span className="material-symbols-rounded transition-all duration-300 group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* About Content Section */}
      <div id="about-content">
        <AboutContent />
      </div>

      {/* Why Choose Us Section */}
      <div id="why-choose-us">
        <WhyChooseUs />
      </div>

      {/* What Our Learners Say Section */}
      <Testimonials />
    </>
  );
};

PageAboutUs.Layout = BaseLayout;

