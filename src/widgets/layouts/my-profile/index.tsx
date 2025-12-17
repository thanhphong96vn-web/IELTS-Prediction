import { Container } from "@/shared/ui";
import { Footer, Header } from "../base/ui";
import { Navigation } from "./ui";
import { ROUTES } from "@/shared/routes";
import { useRouter } from "next/router";
import { ComparePlans } from "@/widgets";

export const MyProfileLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const ACCOUNT_NAVIGATION = [
    {
      label: "My Dashboard",
      icon: "home",
      link: ROUTES.ACCOUNT.DASHBOARD,
    },
    {
      label: "My Profile",
      icon: "person",
      link: ROUTES.ACCOUNT.MY_PROFILE,
    },
    {
      label: "Order History",
      icon: "shopping_cart",
      link: ROUTES.ACCOUNT.ORDER_HISTORY,
    },
    {
      type: "divider",
    },
    {
      label: "Logout",
      icon: "logout",
      link: "#",
      danger: true,
    },
  ];

  return (
    <>
      <Header />
      <Container>
        <div className="py-8">
          <div className="flex flex-wrap -m-4">
            <div className="w-full md:w-4/12 p-4 space-y-4">
              <Navigation navigation={ACCOUNT_NAVIGATION} />
              <ComparePlans />
            </div>
            <div className="w-full md:w-8/12 p-4">
              <h1 className="text-xl font-bold mb-6 text-gray-900">
                {ACCOUNT_NAVIGATION.find(
                  (item) =>
                    item.link === router.pathname && !item.type && !item.danger
                )?.label || "Dashboard"}
              </h1>
              {children}
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
};
