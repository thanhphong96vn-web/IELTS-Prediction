import Link from "next/link";
import { useProContentModal } from "../pro-content";
import { JSX } from "react";
import { useAuth } from "@/appx/providers";
import { twMerge } from "tailwind-merge";

export const ProLink = ({
  title,
  href,
  isPro,
  children,
  ...props
}: {
  title: string;
  href: string;
  isPro: boolean;
  children: React.ReactNode;
} & Pick<
  React.ComponentProps<typeof Link> | JSX.IntrinsicElements["button"],
  "className"
>) => {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);

  return isPro && !currentUser?.userData.isPro ? (
    <button
      title={title}
      onClick={openProContentModal}
      className={twMerge(props.className, "cursor-pointer")}
    >
      {children}
    </button>
  ) : (
    <Link href={href} title={title} {...props}>
      {children}
    </Link>
  );
};
