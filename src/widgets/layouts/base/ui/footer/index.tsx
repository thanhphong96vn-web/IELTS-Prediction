import Link from "next/link";
import { Container } from "@/shared/ui";
import { FacebookRoundedIcon, ZaloIcon } from "@/shared/ui/icons";
import { useAppContext } from "@/appx/providers";
import { useMemo } from "react";
import Image from "next/image";

export const Footer = () => {
  const {
    masterData: {
      websiteOptions: {
        websiteOptionsFields: {
          generalSettings: { facebook, email, zalo },
        },
      },
    },
  } = useAppContext();

  const socials = useMemo(
    () => [
      {
        icon: <ZaloIcon className="h-6 w-6" />,
        url: zalo,
        name: "Zalo OA",
      },
      {
        icon: <FacebookRoundedIcon className="h-6 w-6" />,
        url: facebook,
        name: "Facebook",
      },
      {
        icon: (
          <Image
            src="/mail.webp"
            alt="mail"
            width={24}
            height={24}
            unoptimized
          />
        ),
        url: email,
        name: "Mail",
      },
    ],
    [zalo, facebook, email]
  );

  return (
    <footer className="bg-primary text-white text-base">
      <Container className="py-10">
        <div className="space-y-4">
          <h3 className="font-bold text-xl">About us</h3>
          <p className="font-nunito">
            IELTS Prediction Test (IPT) specializes in providing highly
            accuratte test simulations and forecast sets that closely reflect
            the real IELTS exam. With years of experience, we offer trsted
            predictions specifically for the paper-based IELTS in Southeast
            Asia. Our answer keys are carefully craftedsure exceptional
            accuracy. For further information, please contact us at{" "}
            <Link
              className="underline underline-offset-2"
              href="mailto:ieltsprediction9@gmail.com"
            >
              ieltsprediction9@gmail.com
            </Link>
            .
          </p>
          <div>
            <ul className="space-y-2 -m-1">
              {socials.map((item) => (
                <li
                  className="flex flex-wrap items-center space-x-2 p-1 gap-y-1"
                  key={item.url}
                >
                  <div className="w-32 flex items-center space-x-4">
                    {item.icon}
                    <p className="font-semibold font-nunito">{item.name}</p>
                  </div>
                  <div className="flex-1">
                    <Link
                      className="underline underline-offset-2"
                      rel="noopener noreferrer nofollow"
                      href={item.url}
                      target="_blank"
                      title={item.name}
                    >
                      {item.url}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs space-y-3">
            <p>
              © 2025 IELTS Prediction Test (IPT). All rights reserved. IELTS
              Prediction Test (IPT) is a registered trademark of IELTS
              Prediction Test (IPT).
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
};
