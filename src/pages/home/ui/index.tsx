import { Container } from "@/shared/ui";
import { IeltsTestPlatformIntro } from "./ielts-test-platform-intro";
import { PracticeTest, SampleEssaysSlider } from "@/widgets/blocks";
import { useAuth } from "@/appx/providers";
import { PracticeHistory, TargetScore } from "@/widgets";
import { ROUTES } from "@/shared/routes";

export const PageHome = () => {
  const { isSignedIn } = useAuth();
  return (
    <>
      <IeltsTestPlatformIntro />
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
    </>
  );
};
