import { Card } from "antd";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/router";

export const Navigation = ({
  navigation: ACCOUNT_NAVIGATION,
}: {
  navigation: {
    label: string;
    icon: string;
    link: string;
  }[];
}) => {
  const router = useRouter();

  return (
    <Card
      className="overflow-hidden"
      classNames={{
        body: "p-0!",
      }}
    >
      <ul className="font-nunito">
        {ACCOUNT_NAVIGATION.map((item, index) => (
          <li className="" key={index}>
            <Link
              href={item.link}
              className={twMerge(
                "px-6 py-3 flex hover:bg-primary-50 hover:text-primary-500 hover:font-black text-gray-500 items-center duration-200 transition-all space-x-2",
                router.pathname === item.link
                  ? "bg-primary-50 text-primary-500 font-black"
                  : ""
              )}
            >
              <span className="material-symbols-rounded">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};
