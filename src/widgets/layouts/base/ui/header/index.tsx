import Image from "next/image";
import Link from "next/link";
import { Container } from "@/shared/ui";
import { HeaderNavMain } from "./ui/header-nav-main";
import { useEffect, useMemo, useState } from "react";
import { Button, Drawer, Menu } from "antd";
import { HeaderAccount } from "./ui/header-account";
import { ROUTES } from "@/shared/routes";
import { useRouter } from "next/router";
import { Avatar } from "@/entities";
import { MasterData, MenuItem, useAppContext, useAuth } from "@/appx/providers";
import { ItemType } from "antd/es/menu/interface";
import _ from "lodash";

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
  }, [currentUser?.roles.nodes, isSignedIn, masterData.menuData, router.asPath, signOut]);

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

  return (
    <header className="bg-white">
      <Container className="py-1 md:py-2 h-[50px] sm:h-[70px] md:h-[150px]">
        <div className="flex items-center h-full justify-between">
          <Link
            title="Home"
            href={ROUTES.HOME}
            className="h-full md:w-44 aspect-[750/449] relative duration-300"
          >
            <Image
              sizes="100%"
              alt="logo"
              src="/logo.png"
              priority
              fill
              className="object-contain"
            />
          </Link>
          <div className="md:hidden">
            <button type="button" className="block" onClick={showDrawer}>
              <i className="material-symbols-rounded block!">menu</i>
            </button>
          </div>
        </div>
      </Container>
      <div className="bg-primary text-white text-sm hidden md:block">
        <Container className="h-[50px]">
          <div className="flex items-center h-full justify-between font-bold font-nunito">
            <HeaderNavMain />
            <HeaderAccount />
          </div>
        </Container>
      </div>
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
                        <span className="rounded py-px px-1 font-semibold text-white text-xs shadow bg-primary">
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
            <i className="material-symbols-rounded">close</i>
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
