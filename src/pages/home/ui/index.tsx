import { Container } from "@/shared/ui";
import { IeltsTestPlatformIntro } from "./ielts-test-platform-intro";
import { HeroBanner } from "./hero-banner";
import { WhyChooseUs } from "./why-choose-us";
import { Testimonials } from "./testimonials";
import { PracticeTest, SampleEssaysSlider } from "@/widgets/blocks";
import { useAuth } from "@/appx/providers";
import { PracticeHistory, TargetScore } from "@/widgets";
import { ROUTES } from "@/shared/routes";
import type { HeroBannerConfig } from "./hero-banner/types";
import type { TestPlatformIntroConfig } from "./ielts-test-platform-intro/types";
import type { WhyChooseUsConfig } from "./why-choose-us/types";
import type { TestimonialsConfig } from "./testimonials/types";

interface PageHomeProps {
  heroBannerConfig: HeroBannerConfig;
  testPlatformIntroConfig: TestPlatformIntroConfig;
  whyChooseUsConfig: WhyChooseUsConfig;
  testimonialsConfig: TestimonialsConfig;
}

export const PageHome = ({
  heroBannerConfig,
  testPlatformIntroConfig,
  whyChooseUsConfig,
  testimonialsConfig,
}: PageHomeProps) => {
  const { isSignedIn } = useAuth();
  return (
    <>
      <HeroBanner config={heroBannerConfig} />
      <IeltsTestPlatformIntro config={testPlatformIntroConfig} />
      <div className="py-16">
        <Container className="space-y-16">
          {isSignedIn && (
            <>
              <div>
                <TargetScore />
              </div>
              <section className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-extrabold">
                  Practice History
                </h3>
                <PracticeHistory />
              </section>
            </>
          )}
          <PracticeTest
            skill="listening"
            title="IELTS Listening Practice"
            view_more_link={ROUTES.PRACTICE.ARCHIVE_LISTENING}
          />
          <PracticeTest
            skill="reading"
            title="IELTS Reading Practice"
            view_more_link={ROUTES.PRACTICE.ARCHIVE_READING}
          />
          <SampleEssaysSlider
            view_more_link={ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING}
            skill="writing"
            title="IELTS Writing Sample"
          />
          <SampleEssaysSlider
            view_more_link={ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING}
            skill="speaking"
            title="IELTS Speaking Sample"
          />
        </Container>
      </div>
      <WhyChooseUs config={whyChooseUsConfig} />
      <Testimonials config={testimonialsConfig} />
    </>
  );
};
