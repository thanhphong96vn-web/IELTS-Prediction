import { ROUTES } from "@/shared/routes";
import { Container } from "@/shared/ui";
import Image from "next/image";
import Link from "next/link";

const TEST_NAVIGATIONS = [
  {
    name: "FULL TEST",
    href: ROUTES.EXAM.ARCHIVE,
    icon: "/full_test.jpg",
  },
  {
    name: "LISTENING",
    href: ROUTES.PRACTICE.ARCHIVE_LISTENING,
    icon: "/listening.jpg",
  },
  {
    name: "READING",
    href: ROUTES.PRACTICE.ARCHIVE_READING,
    icon: "/reading.jpg",
  },
  {
    name: "SAMPLE WRITING",
    href: ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING,
    icon: "/writing.jpg",
  },
  {
    name: "SAMPLE SPEAKING",
    href: ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING,
    icon: "/speaking.jpg",
  },
];

export const IeltsTestPlatformIntro = () => {
  return (
    <div className="py-12 md:py-16 bg-gradient-to-b from-secondary-300 text-center">
      <Container className="space-y-12">
        <div className="space-y-1">
          <h1 className="uppercase text-3xl md:text-5xl font-bold text-quaternary-600">
            NỀN TẢNG LUYỆN <br className="sm:hidden" /> THI IELTS TRÊN MÁY
          </h1>
          <h2 className="text-lg md:text-2xl font-semibold italic">
            Thi thử như thật, chinh phục band điểm với kho đề sát thực tế nhất
          </h2>
        </div>
        <div className="sm:w-9/12 md:w-7/12 mx-auto relative">
          <Image
            src="/intro-mascot.png"
            alt="mascot"
            height={300}
            width={300}
            priority
            className="object-contain absolute -translate-x-full -left-6 top-1/2 -translate-y-1/2"
          />
          <div className="flex flex-wrap -m-2 md:-m-4 justify-center">
            {TEST_NAVIGATIONS.map((item, index) => (
              <div className="p-2 md:p-4 w-1/2 sm:w-1/3" key={index}>
                <Link
                  href={item.href}
                  className={`aspect-square relative p-4 space-y-2 bg-gradient-to-r bg-[length:200%] overflow-hidden bg-left hover:bg-right duration-300 ease-in-out rounded-2xl flex flex-col justify-center items-center`}
                >
                  <Image
                    src={item.icon}
                    alt={item.name}
                    fill
                    sizes="100%"
                    className="object-contain"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};
