import Link from "next/link";
import { useMemo } from "react";
import { ConfigProvider, Dropdown } from "antd";
import { createStyles } from "antd-style";
import { ROUTES } from "@/shared/routes";
import { MasterData, useAppContext } from "@/appx/providers";

const useStyle = createStyles(({ css }) => ({
  headerNavMenu: css`
    &::after {
      content: "";
      position: absolute;
      display: inline-block;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      background: linear-gradient(
        to bottom,
        color-mix(in oklab, var(--color-primary) 50%, transparent),
        var(--color-primary-500)
      );
      backdrop-filter: blur(15px);
      z-index: -1;
    }

    .ant-dropdown-menu,
    &.ant-dropdown-menu {
      border-radius: 0;
      box-shadow: -14px 9px 36px -14px var(--color-primary-200);
      z-index: 1;
      background-color: transparent;
      padding: 0;

      .ant-dropdown-menu-item,
      .ant-dropdown-menu-submenu-title,
      .ant-dropdown-menu-submenu-expand-icon
        .ant-dropdown-menu-submenu-arrow-icon,
      .ant-dropdown-menu-submenu-expand-icon
        .ant-dropdown-menu-submenu-arrow-icon {
        color: #f1ebeb !important;
        font-weight: 600;
        line-height: 50px;
        padding-top: 0;
        padding-bottom: 0;
        border-radius: 0;
      }
    }

    .ant-dropdown-menu-item-active,
    .ant-dropdown-menu-submenu-active {
      background-color: var(--color-primary-500) !important;
    }
  `,
}));

function createModifiedMenuData(
  menu: MasterData["menuData"][string] | undefined,
  modifyFn: (
    item: MasterData["menuData"][string][number]
  ) => string | React.ReactNode
): MasterData["menuData"][string] {
  if (!menu) return [];
  const newMenuData = menu.map((item) => {
    return {
      ...item,
      label: modifyFn(item),
      children: item.children
        ? createModifiedMenuData(item.children, modifyFn)
        : undefined,
    };
  });

  return newMenuData;
}

export const HeaderNavMain = () => {
  const { styles } = useStyle();
  const { masterData } = useAppContext();

  const menuDataMapped = useMemo(() => {
    if (!masterData?.menuData["main-menu"]) return [];
    const menuData = masterData.menuData;

    return [
      {
        label: (
          <span className="text-[32px]">
            <svg
              width="1em"
              height="1em"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1664 1896.0833"
              fill="currentColor"
            >
              <path d="M1408 992v480q0 26-19 45t-45 19H960v-384H704v384H320q-26 0-45-19t-19-45V992q0-1 .5-3t.5-3l575-474 575 474q1 2 1 6zm223-69l-62 74q-8 9-21 11h-3q-13 0-21-7L832 424l-692 577q-12 8-24 7-13-2-21-11l-62-74q-8-10-7-23.5T37 878l719-599q32-26 76-26t76 26l244 204V288q0-14 9-23t23-9h192q14 0 23 9t9 23v408l219 182q10 8 11 21.5t-7 23.5z" />
            </svg>
          </span>
        ),
        uri: ROUTES.HOME,
        children: [],
      },
      ...menuData["main-menu"].map((item) => ({
        ...item,
        children: createModifiedMenuData(item.children, (item) => (
          <Link href={item.uri}>{item.label}</Link>
        )),
      })),
    ];
  }, [masterData?.menuData]);

  return (
    <ConfigProvider>
      <ul className="flex items-stretch h-full">
        {menuDataMapped.map((menu, index) => (
          <li key={index}>
            {menu.children && menu.children.length > 0 ? (
              <Dropdown
                menu={{
                  items: menu.children,
                  rootClassName: styles.headerNavMenu,
                }}
                align={{ offset: [0, 0] }}
              >
                <Link
                  className="px-2.5 flex items-center justify-center leading-[50px] h-full hover:bg-primary-400 transition-all duration-150"
                  href={menu.uri}
                >
                  <span>{menu.label}</span>
                  {menu.children.length > 0 && (
                    <i className="material-symbols-rounded ml-2">
                      keyboard_arrow_down
                    </i>
                  )}
                </Link>
              </Dropdown>
            ) : (
              <Link
                className="px-2.5 flex items-center justify-center leading-[50px] h-full hover:bg-primary-400 transition-all duration-150"
                href={menu.uri}
              >
                <span>{menu.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </ConfigProvider>
  );
};
