import { ConfigProvider, Input, Select, Tabs, TabsProps } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { FilterFormValues } from "..";
import { useEffect } from "react";
import { useRouter } from "next/router";
import _ from "lodash";

const items: TabsProps["items"] = [
  {
    key: "all",
    label: "All Tests",
    icon: (
      <span className="material-symbols-rounded align-middle">checklist</span>
    ),
  },
  {
    key: "academic",
    label: "Academic Test",
    icon: <span className="material-symbols-rounded align-middle">school</span>,
  },
  {
    key: "general",
    label: "General Test",
    icon: <span className="material-symbols-rounded align-middle">groups</span>,
  },
];

export const Filter = () => {
  const router = useRouter();
  const { control, setValue, reset } = useFormContext<FilterFormValues>();

  useEffect(() => {
    const queryParams = _.merge(
      {
        type: "all",
        sort: "newest",
      },
      router.query
    );
    reset(queryParams as unknown as FilterFormValues);
  }, [reset, router.query]);

  return (
    <>
      <Controller
        name="type"
        control={control}
        render={({ field: { onChange } }) => (
          <ConfigProvider
            theme={{
              components: {
                Tabs: {
                  horizontalMargin: "0px",
                },
              },
            }}
          >
            <Tabs
              defaultActiveKey={router.query.type?.toString() || "all"}
              items={items}
              size="large"
              onChange={onChange}
            />
          </ConfigProvider>
        )}
      />
      <div className="flex">
        <div className="w-1/2">
          <Input.Search
            allowClear
            onClear={() => {
              setValue("search", "", { shouldDirty: true });
            }}
            defaultValue={router.query.search?.toString() || ""}
            placeholder="Search"
            onSearch={(value) => {
              setValue("search", value, { shouldDirty: true });
            }}
            enterButton
          />
        </div>
        <div className="w-1/2 flex justify-end">
          <Controller
            name="sort"
            control={control}
            render={({ field }) => (
              <Select
                className="min-w-32"
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "popular", label: "Popular" },
                  { value: "high-ranking", label: "High Ranking" },
                ]}
                {...field}
              />
            )}
          />
        </div>
      </div>
    </>
  );
};
