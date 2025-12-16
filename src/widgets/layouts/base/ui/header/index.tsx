import Image from "next/image";
import Link from "next/link";
import { Container } from "@/shared/ui";
import { HeaderNavMain } from "./ui/header-nav-main";
import { useEffect, useMemo, useState } from "react";
import { Button, Drawer, Menu } from "antd";
import { ROUTES } from "@/shared/routes";
import { useRouter } from "next/router";
import { Avatar } from "@/entities";
import { MasterData, MenuItem, useAppContext, useAuth } from "@/appx/providers";
import { ItemType } from "antd/es/menu/interface";
import _ from "lodash";
import { FacebookRoundedIcon, ZaloIcon } from "@/shared/ui/icons";

function createModifiedMenuData(
  menu: MasterData["menuData"][string] | undefined,
  modifyFn: (
    item: MasterData["menuData"][string][number]
  ) => string | React.ReactNode
): ItemType[] | undefined {
  if (!menu) return undefined;
  return menu.map((item) => {
    if (item.children && item.children.length) {
      return {
        key: item.key.toString(),
        label: modifyFn(item),
        children: createModifiedMenuData(item.children, modifyFn),
      };
    }
    return {
      key: item.key.toString(),
      label: modifyFn(item),
    };
  });
}

export const Header = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>("");

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  const { isSignedIn, signOut, currentUser } = useAuth();
  const { masterData } = useAppContext();

  const {
    websiteOptions: {
      websiteOptionsFields: {
        generalSettings: {
          facebook,
          phoneNumber,
          logo,
          zalo,
          buyProLink,
          email,
        },
      },
    },
    allSettings: { generalSettingsTitle },
  } = masterData;

  const menuDataMapped = useMemo(() => {
    if (!masterData?.menuData["main-menu"]) return [];
    const menuData = masterData.menuData;

    const menu = [
      ...createModifiedMenuData(menuData["main-menu"], (item) => (
        <Link href={item.uri}>{item.label}</Link>
      ))!,
    ];

    if (isSignedIn) {
      menu.push(
        { type: "divider" },
        {
          key: "1",
          label: <Link href={ROUTES.ACCOUNT.DASHBOARD}>My Dashboard</Link>,
        },
        {
          key: "2",
          label: <Link href={ROUTES.ACCOUNT.MY_PROFILE}>My Profile</Link>,
        },
        {
          key: "3",
          label: (
            <Link href={ROUTES.ACCOUNT.PAYMENT_HISTORY}>Payment History</Link>
          ),
        },
        ...(currentUser?.roles.nodes[0].name === "administrator"
          ? [
              { type: "divider" as const },
              {
                key: "4",
                label: (
                  <Link href={ROUTES.ADMIN.DASHBOARD}>Admin Dashboard</Link>
                ),
                icon: (
                  <i className="material-symbols-rounded">
                    admin_panel_settings
                  </i>
                ),
              },
            ]
          : []),
        { type: "divider" },
        {
          key: "5",
          label: "Logout",
          onClick: signOut,
          icon: <i className="material-symbols-rounded">logout</i>,
          danger: true,
        }
      );
    } else {
      menu.push(
        { type: "divider" },
        {
          key: "6",
          label: <Link href={ROUTES.LOGIN(router.asPath)}>Login</Link>,
        },
        {
          key: "7",
          label: <Link href={ROUTES.REGISTER}>Sign Up</Link>,
        }
      );
    }

    return menu;
  }, [
    currentUser?.roles.nodes,
    isSignedIn,
    masterData.menuData,
    router.asPath,
    signOut,
  ]);

  useEffect(() => {
    const flattenMenuData = (menuData: MasterData["menuData"]) => {
      return _.flatMapDeep(Object.values(menuData), (menuItems) => {
        const flattenItems = (items: MenuItem[]): MenuItem[] => {
          return _.flatMapDeep(items, (item: MenuItem) => {
            return [
              item,
              ...(item.children ? flattenItems(item.children) : []),
            ];
          });
        };
        return flattenItems(menuItems);
      });
    };

    const flattened = flattenMenuData(masterData.menuData);

    const item = flattened.find((item) => {
      try {
        const itemUrl = new URL(item.uri, window.location.origin);
        return itemUrl.pathname === router.pathname;
      } catch {
        return false;
      }
    });

    if (item) {
      setActiveKey(item.key.toString());
    }
  }, [masterData.menuData, router.pathname]);

  const topBarSocialLinks = [
    {
      icon: <FacebookRoundedIcon className="w-4 h-4" />,
      url: facebook,
      name: "Facebook",
    },
    {
      icon: <ZaloIcon className="w-4 h-4" />,
      url: zalo,
      name: "Zalo",
    },
    {
      icon: (
        <Image
          src="/mail.webp"
          alt="mail"
          width={16}
          height={16}
          unoptimized
          className="w-4 h-4"
        />
      ),
      url: email ? `mailto:${email}` : null,
      name: "Email",
    },
  ].filter((item) => Boolean(item.url));

  return (
    <header className="bg-white">
      {/* Top Bar */}
      <div
        className="bg-[#192335] text-white text-sm hidden md:block"
        style={{ backgroundColor: "#192335" }}
      >
        <Container className="py-2">
          <div className="flex items-center justify-between">
            {/* Left Side - Contact & Social Stats */}
            <div className="flex items-center gap-6 whitespace-nowrap">
              {facebook && (
                <div className="flex items-center gap-2">
                  <FacebookRoundedIcon className="w-4 h-4" />
                  <span className="text-xs whitespace-nowrap">
                    500k Followers
                  </span>
                </div>
              )}
              {phoneNumber && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-base">
                    phone
                  </span>
                  <span className="text-xs whitespace-nowrap">
                    {phoneNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Middle Section - Promotional Banner */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Button
                className="bg-[#2563eb] border-none text-white rounded-md h-6 px-2 text-xs font-bold whitespace-nowrap"
                style={{ backgroundColor: "#2563eb" }}
              >
                Hot
              </Button>
              <span className="text-xl">👋</span>
              <span className="text-xs whitespace-nowrap">
                Intro price. Get {generalSettingsTitle || "Histudy"} for Big
                Sale -95% off.
              </span>
            </div>

            {/* Right Side - Social Links */}
            <div className="flex items-center gap-3">
              {topBarSocialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-300 transition-colors"
                  title={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* Main Navigation Bar */}
      <Container className="py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo */}
          <div className="flex items-center gap-4">
            <Link
              title="Home"
              href={ROUTES.HOME}
              className="h-12 max-h-12 w-auto relative flex items-center overflow-hidden"
            >
              {logo?.node?.sourceUrl ? (
                <div className="relative h-12 max-h-12 w-auto max-w-[200px] flex items-center">
                  <Image
                    src={logo.node.sourceUrl}
                    alt={generalSettingsTitle || "Logo"}
                    width={120}
                    height={48}
                    className="object-contain max-h-full max-w-full"
                    style={{ maxHeight: "48px", maxWidth: "200px" }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: "#d94a56" }}
                  >
                    {generalSettingsTitle?.charAt(0) || "L"}
                  </div>
                  <span
                    className="font-bold text-xl whitespace-nowrap"
                    style={{ color: "#d94a56" }}
                  >
                    {generalSettingsTitle || "Logo"}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Middle Section - Navigation Links */}
          <div className="hidden lg:flex items-center">
            <HeaderNavMain />
          </div>

          {/* Right Side - User Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-gray-700 hover:text-[#d94a56] transition-colors"
              title="Search"
            >
              <span className="material-symbols-rounded text-xl">search</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <Avatar currentUser={currentUser} size={32} />
                <span className="text-sm font-medium text-gray-700">
                  {currentUser?.name || "User"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href={ROUTES.REGISTER}
                  className="text-sm font-medium text-gray-700 hover:text-[#d94a56] transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href={ROUTES.LOGIN()}
                  className="text-sm font-medium text-gray-700 hover:text-[#d94a56] transition-colors"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              type="button"
              className="block"
              onClick={showDrawer}
              title="Menu"
            >
              <span className="material-symbols-rounded text-2xl">menu</span>
            </button>
          </div>
        </div>
      </Container>

      <Drawer
        classNames={{
          header: "!py-2",
          body: "!px-1 !py-2",
        }}
        title={
          <ul>
            {isSignedIn && (
              <li>
                <div
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  title={currentUser?.name}
                >
                  <Avatar currentUser={currentUser} size={36} />
                  <div>
                    <p className="font-bold space-x-2">
                      <span>{currentUser?.name}</span>
                      {currentUser?.userData.isPro && (
                        <span
                          className="rounded py-px px-1 font-semibold text-white text-xs shadow"
                          style={{ backgroundColor: "#d94a56" }}
                        >
                          PRO
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            )}
          </ul>
        }
        closable={false}
        onClose={onClose}
        open={open}
        extra={
          <Button
            variant="text"
            color="default"
            shape="circle"
            onClick={onClose}
          >
            <span className="material-symbols-rounded">close</span>
          </Button>
        }
      >
        <Menu
          mode="inline"
          items={menuDataMapped}
          selectable={false}
          selectedKeys={[activeKey]}
        />
      </Drawer>
    </header>
  );
};
