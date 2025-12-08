import { QuizLibraryNav, SEOHeader } from "@/widgets";
import { SampleEssayProps } from "../..";
import { Container, Empty } from "@/shared/ui";
import { Breadcrumb, Button, Input, Pagination, Select } from "antd";
import { useRouter } from "next/router";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import _ from "lodash";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Filter } from "./filter";
import { DefaultView } from "./single-item";

const PAGE_SIZE = 18;

// const skillNav = [
//   {
//     name: "Writing",
//     link: ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING,
//     icon: "/Pencil.svg",
//     skill: "writing",
//   },
//   {
//     name: "Speaking",
//     link: ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING,
//     icon: "/speech.png",
//     skill: "speaking",
//   },
//   {
//     name: "Reading",
//     link: ROUTES.SAMPLE_ESSAY.ARCHIVE_READING,
//     icon: "/Reading.png",
//     skill: "reading",
//   },
//   {
//     name: "Listening",
//     link: ROUTES.SAMPLE_ESSAY.ARCHIVE_LISTENING,
//     icon: "/Listening.png",
//     skill: "listening",
//   },
// ];

export type FilterFormValues = {
  sampleSource: string;
  part: string;
  sort: "newest" | "oldest" | "popular" | "a-z" | "z-a";
  search: string;
  size: number;
  year: string;
  topic: string;
  questionType: string;
  quarter: string;
};

export const PageArchive = ({
  sampleEssays,
  seo,
  pageSize,
  paged,
  skill,
  filterData,
}: SampleEssayProps) => {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const methods = useForm<FilterFormValues>({
    defaultValues: {
      sort: "newest",
      search: "",
      size: PAGE_SIZE,
    },
  });
  const {
    watch,
    formState: { isDirty },
    setValue,
  } = methods;

  useEffect(() => {
    setValue(
      "sort",
      (router.query.sort as FilterFormValues["sort"]) || "newest"
    );
  }, [router.query, setValue]);

  const filterValues = watch();

  useEffect(() => {
    if (!isDirty) return;
    let params = _.omit(router.query, ["slug"]);

    Object.keys(filterValues).forEach((key) => {
      const value = filterValues[key as keyof FilterFormValues];
      if (
        value === "all" ||
        !value ||
        value === "newest" ||
        (key === "size" && value === PAGE_SIZE)
      ) {
        params = _.omit(params, key);
      } else {
        if (_.isArray(value)) {
          if (value.length === 0) {
            params = _.omit(params, key);
          } else {
            _.set(params, key, value.join(","));
          }
        } else _.set(params, key, value.toString());
      }
    });

    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const queryString = queryParams.toString();

    if (queryString) {
      router.push(
        `${
          skill === "speaking"
            ? `${ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING}`
            : `${ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING}`
        }?${queryString}`
      );
      return;
    }

    router.push(
      skill === "speaking"
        ? `${ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING}`
        : `${ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING}`
    );
  }, [filterValues, isDirty, router, skill]);

  return (
    <FormProvider {...methods}>
      <SEOHeader fullHead={seo.fullHead} title={seo.title} />
      <Container className="pb-10">
        <div className="py-5">
          <Breadcrumb
            items={[
              {
                title: <Link href="/">Home</Link>,
              },
              {
                title: `IELTS ${_.capitalize(skill)} Sample`,
              },
            ]}
          />
        </div>
        <h1 className="pb-4 sm:pb-6 text-2xl md:text-5xl font-extrabold text-primary">
          IELTS {_.capitalize(skill)} Sample
        </h1>
        <div className="mb-12">
          <QuizLibraryNav />
        </div>
        <div className="flex -m-4 flex-wrap">
          <div className="p-4 md:w-3/12 w-full hidden sm:block">
            <div className="h-full">
              <Filter
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                filterData={filterData}
                skill={skill}
              />
            </div>
          </div>
          <div className="p-4 md:w-9/12 w-full">
            <div className="flex flex-wrap justify-between gap-4 items-center">
              <div className="flex items-stretch flex-wrap -m-1.5">
                {/* {skillNav.map((item) => (
                  <div key={item.name} className="p-1.5 sm:w-auto w-1/2">
                    <Link
                      href={item.link}
                      className={twMerge(
                        "flex items-center px-2 py-1 bg-gray-200 rounded space-x-2",
                        skill === item.skill && "bg-primary text-white"
                      )}
                    >
                      <Image
                        width={20}
                        height={20}
                        src={item.icon}
                        alt={item.name}
                      />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </div>
                ))} */}
              </div>
              <div className="w-full sm:hidden">
                <Input.Search
                  size="large"
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
              <Button onClick={() => setDrawerOpen(true)} className="sm:hidden">
                <span className="material-symbols-rounded">filter_alt</span>
                <span className="leading-none">Filter</span>
              </Button>
              <Controller
                name="sort"
                control={methods.control}
                render={({ field }) => (
                  <Select<FilterFormValues["sort"]>
                    options={[
                      { label: "Newest", value: "newest" },
                      { label: "Oldest", value: "oldest" },
                      { label: "A-Z", value: "a-z" },
                      { label: "Z-A", value: "z-a" },
                    ]}
                    {...field}
                  />
                )}
              />
            </div>
            <div className="pb-5 space-y-4 mt-4">
              {sampleEssays.edges.length > 0 ? (
                <>
                  <div className="flex -m-1.5 flex-wrap items-stretch">
                    {sampleEssays.edges.map((item, index) => (
                      <div className="p-1.5 w-1/2 md:w-1/3" key={index}>
                        <DefaultView post={item} skill={skill} />
                      </div>
                    ))}
                  </div>
                  {sampleEssays.pageInfo.offsetPagination.total - pageSize >
                    0 && (
                    <Pagination
                      className="justify-center"
                      defaultCurrent={paged}
                      defaultPageSize={pageSize}
                      total={sampleEssays.pageInfo.offsetPagination.total}
                      onChange={(page) => {
                        router.push(
                          skill === "speaking"
                            ? `${
                                ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING
                              }/page/${page}?${new URLSearchParams(
                                window.location.search
                              ).toString()}`
                            : `${
                                ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING
                              }/page/${page}?${new URLSearchParams(
                                window.location.search
                              ).toString()}`
                        );
                      }}
                    />
                  )}
                </>
              ) : (
                <Empty
                  title="There is no sample essay!"
                  subtitle="We will update as soon as possible."
                />
              )}
            </div>
          </div>
        </div>
      </Container>
    </FormProvider>
  );
};
