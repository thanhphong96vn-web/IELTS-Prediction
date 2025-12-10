import { createContext, useContext, useMemo } from "react";

export type MenuItem = {
  key: number;
  label: string | React.ReactNode;
  uri: string;
  children?: Array<MenuItem>;
};

export type MasterData = {
  websiteOptions: {
    websiteOptionsFields: {
      generalSettings: {
        favicon: {
          node: {
            sourceUrl: string;
          };
        };
        logo: {
          node: {
            sourceUrl: string;
          };
        };
        facebook: string;
        email: string;
        zalo: string;
        phoneNumber: string;
        preventCopy: boolean;
        buyProLink: string;
        bannerTestResult?: {
          node: {
            sourceUrl: string;
          };
        };
      };
    };
  };
  allSettings: {
    generalSettingsTitle: string;
  };
  menuData: {
    [key: string]: Array<MenuItem>;
  };
  viewer?: {
    id: string;
    name: string;
    roles: {
      nodes: Array<{ name: string }>;
    };
    userData: {
      avatar?: {
        node: {
          mediaDetails: {
            sizes: Array<{
              sourceUrl: string;
              width: string;
            }>;
          };
          srcSet: string;
        };
      };
      isPro: boolean;
      proExpirationDate?: string;
    };
  };
  userCredentials?: {
    authToken: string;
    refreshToken: string;
  };
};

type Context = { masterData: MasterData };

const AppContext = createContext<Context>({} as Context);

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({
  children,
  masterData,
}: {
  children: React.ReactNode;
  masterData: MasterData;
}) => {
  const contextValue = useMemo(() => ({ masterData }), [masterData]);
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
