import { Container, Empty } from "@/shared/ui";
import {
  Breadcrumb,
  Button,
  Divider,
  Input,
  Pagination,
  Select,
  Skeleton,
} from "antd";
import Link from "next/link";
import { Filter } from "./filter";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { QuizLibraryNav } from "@/widgets";
import { useLazyQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import _ from "lodash";
import {
  GET_PRACTICE_TESTS,
  IPracticeTestResponses,
  PracticeTestItem,
} from "@/entities/practice-test";
import { QUESTION_FORMS } from "@/shared/constants";
import { PracticeTest } from "@/widgets/blocks";

export type FilterFormValues = {
  progress: "pending" | "completed" | "in-progress";
  question_form: (typeof QUESTION_FORMS)[number]["value"][];
  sort: "newest" | "oldest" | "popular" | "a-z" | "z-a";
  search: string;
  page: number;
  size: number;
  quarter: string;
  year: string;
  source: string;
  part: string;
};

const PAGE_SIZE = 9;

export const PageIELTSPracticeLibrary = ({
  quizFilterData,
}: {
  quizFilterData: {
    years: Array<string>;
    sources: Array<string>;
    parts: Array<string>;
  };
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const methods = useForm<FilterFormValues>({
    defaultValues: {
      sort: "newest",
      search: "",
      page: 1,
      size: PAGE_SIZE,
    },
  });
  const {
    watch,
    formState: { isDirty },
    setValue,
  } = methods;

  const [getData, { data, loading, called, variables }] =
    useLazyQuery<IPracticeTestResponses>(GET_PRACTICE_TESTS, {
      context: {
        authRequired: true,
      },
    });

  useEffect(() => {
    const {
      sort,
      search,
      page,
      size: pageSize,
      question_form,
      source,
      part,
      quarter,
      year,
    } = router.query;
    const size = Number(pageSize) || PAGE_SIZE;
    const offset = (Number(page) - 1) * size || 0;
    const params = {
      search,
      offsetPagination: {
        offset,
        size,
      },
      size: "LARGE",
      question_form,
      skill: router.pathname.split("/").pop(),
      source,
      part,
      quarter,
      year,
    };

    switch (sort) {
      case "newest":
        _.set(params, "orderby", [{ field: "DATE", order: "DESC" }]);
        break;
      case "oldest":
        _.set(params, "orderby", [{ field: "DATE", order: "ASC" }]);
        break;
      case "popular":
        // _.set(params, "orderby", [{ field: "VIEW_COUNT", order: "DESC" }]);
        break;
      case "a-z":
        _.set(params, "orderby", [{ field: "TITLE", order: "ASC" }]);
        break;
      case "z-a":
        _.set(params, "orderby", [{ field: "TITLE", order: "DESC" }]);
        break;
      default:
        _.set(params, "orderby", [{ field: "DATE", order: "DESC" }]);
        break;
    }

    getData({
      variables: params,
    });
  }, [getData, router.pathname, router.query]);

  const filterValues = watch();

  useEffect(() => {
    if (!isDirty) return;
    const queryParams = new URLSearchParams(window.location.search);
    Object.keys(filterValues).forEach((key) => {
      const value = filterValues[key as keyof FilterFormValues];
      if (
        value === "all" ||
        !value ||
        value === "newest" ||
        (key === "page" && value === 1) ||
        (key === "size" && value === PAGE_SIZE)
      ) {
        queryParams.delete(key);
      } else {
        if (_.isArray(value)) {
          if (value.length === 0) {
            queryParams.delete(key);
          } else {
            queryParams.set(key, value.join(","));
          }
        } else queryParams.set(key, value.toString());
      }
    });

    const defaultFilter = _.merge(
      {
        sort: "newest",
        size: PAGE_SIZE,
      },
      router.query
    );

    const isKeyDifferent = Object.keys(defaultFilter).some(
      (key) =>
        key !== "page" &&
        defaultFilter[key] !== filterValues[key as keyof FilterFormValues]
    );
    if (isKeyDifferent) {
      queryParams.delete("page");
    }

    router.push({ search: queryParams.toString() }, undefined, {
      shallow: true,
    });
  }, [filterValues, isDirty, router]);

  return (
    <FormProvider {...methods}>
      {/* <SEOHeader fullHead={category.seo.fullHead} title={category.seo.title} /> */}
      <Container className="space-y-12 pb-5">
        <div className="space-y-2">
          <div className="pt-5 pb-3">
            <Breadcrumb
              items={[
                {
                  title: <Link href="/">Home</Link>,
                },
                {
                  title: "IELTS Practice Library",
                },
                {
                  title: _.capitalize(router.pathname.split("/").pop() || ""),
                },
              ]}
            />
          </div>
          <PracticeTest title="Suggestions for you" view_more={false} />
          <Divider className="my-8!" />
          <h1 className="pb-4 text-3xl md:text-5xl font-extrabold text-primary">
            IELTS {_.capitalize(router.pathname.split("/").pop() || "")}{" "}
            Practice
          </h1>
          <QuizLibraryNav />
        </div>
        <div className="flex flex-wrap -m-3">
          <div className="hidden sm:block w-1/3 md:w-1/4 p-3">
            <Filter
              filterData={quizFilterData}
              drawerOpen={drawerOpen}
              setDrawerOpen={setDrawerOpen}
            />
          </div>
          <div className="w-full sm:w-2/3 md:w-3/4 p-3 space-y-4">
            {data && (
              <div className="flex flex-wrap justify-between sm:justify-end gap-4">
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
                <Button
                  onClick={() => setDrawerOpen(true)}
                  className="sm:hidden"
                >
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
                        { label: "Popular", value: "popular" },
                        { label: "A-Z", value: "a-z" },
                        { label: "Z-A", value: "z-a" },
                      ]}
                      {...field}
                    />
                  )}
                />
              </div>
            )}
            <div className="flex flex-wrap -m-3">
              {loading
                ? Array.from({ length: 12 }).map((_, index) => (
                    <div className="w-full sm:w-1/2 md:w-1/3 p-3" key={index}>
                      <Skeleton active />
                    </div>
                  ))
                : data?.quizzes.edges.map(({ node: item }, index) => (
                    <div className="w-full sm:w-1/2 md:w-1/3 p-3" key={index}>
                      <PracticeTestItem item={item} />
                    </div>
                  ))}
              {called && !loading && !data?.quizzes.edges.length && (
                <div className="w-full p-3">
                  <Empty title="No practice tests found!" />
                </div>
              )}
            </div>
            {called &&
              !loading &&
              data &&
              data.quizzes.pageInfo.offsetPagination.total > PAGE_SIZE && (
                <Pagination
                  defaultCurrent={
                    router.query.page ? Number(router.query.page) : 1
                  }
                  defaultPageSize={PAGE_SIZE}
                  total={data.quizzes.pageInfo.offsetPagination.total || 0}
                  pageSize={variables?.offsetPagination.size}
                  showSizeChanger={false}
                  onChange={(page, pageSize) => {
                    setValue("size", pageSize, {
                      shouldDirty: true,
                    });
                    setValue("page", page, {
                      shouldDirty: true,
                    });
                  }}
                  className="mt-5 justify-center"
                />
              )}
          </div>
        </div>
      </Container>
    </FormProvider>
  );
};
