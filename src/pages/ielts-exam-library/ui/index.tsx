import { Container } from "@/shared/ui";
import { Breadcrumb, Empty, Pagination, Spin, Tabs } from "antd";
import Link from "next/link";
import { Filter } from "./filter";
import { FormProvider, useForm } from "react-hook-form";
import { QuizLibraryNav, SEOHeader } from "@/widgets";
import {
  IELTSListeningExamIcon,
  IELTSReadingExamIcon,
} from "@/shared/ui/icons";
import { useLazyQuery } from "@apollo/client";
import {
  GET_EXAM_COLLECTIONS,
  IExamCollection,
  IExamCollectionResponse,
} from "../api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ExamCollection from "./exam-collection";
import _ from "lodash";

export type FilterFormValues = {
  type: "all" | "academic" | "general";
  sort: "newest" | "popular" | "high-ranking";
  search: string;
  page: number;
  size: number;
};

const PAGE_SIZE = 10;

export const PageIELTSExamLibrary = () => {
  const router = useRouter();
  const methods = useForm<FilterFormValues>({
    defaultValues: {
      type: "all",
    },
  });
  const {
    setValue,
    watch,
    formState: { isDirty },
  } = methods;

  const [getData, { data, loading, called, variables }] =
    useLazyQuery<IExamCollectionResponse>(GET_EXAM_COLLECTIONS, {
      context: {
        authRequired: true,
      },
    });

  useEffect(() => {
    const { type, sort, search, page, size: pageSize } = router.query;
    const size = Number(pageSize) || PAGE_SIZE;
    const offset = (Number(page) - 1) * size || 0;
    const params = {
      type,
      sort,
      search,
      offsetPagination: {
        offset,
        size,
      },
    };

    getData({
      variables: params,
    });
  }, [getData, router.query]);

  const [activeKey, setActiveKey] = useState<string>("reading");

  useEffect(() => {
    if (!data) return;
    setActiveKey(
      data.examCollection.data.reading.length === 0 &&
        data.examCollection.data.listening.length > 0
        ? "listening"
        : "reading"
    );
  }, [data]);

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
        queryParams.set(key, value.toString());
      }
    });

    const defaultFilter = _.merge(
      {
        type: "all",
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
      <SEOHeader fullHead={""} title={"IELTS Exam Library"} />
      <Container className="space-y-4 pb-5">
        <div className="space-y-2">
          <div className="pt-5 pb-3">
            <Breadcrumb
              items={[
                {
                  title: <Link href="/">Home</Link>,
                },
                {
                  title: "IELTS Exam Library",
                },
              ]}
            />
          </div>
          <h1 className="pb-4 text-3xl md:text-5xl font-extrabold text-primary">
            IELTS Exam Library
          </h1>
          <QuizLibraryNav />
          <Filter />
        </div>
        <Spin spinning={loading || !called}>
          <Tabs
            type="card"
            activeKey={activeKey}
            onTabClick={setActiveKey}
            items={[
              {
                key: "reading",
                label: `Reading (${
                  _.sum(
                    data?.examCollection.data.reading.map(
                      (item) => item.exams.length
                    )
                  ) || 0
                })`,
                children: (
                  <IELTSExamLibraryTab
                    data={data?.examCollection.data.reading}
                    loading={loading || !called}
                  />
                ),
                icon: (
                  <IELTSReadingExamIcon className="inline-block" width={18} />
                ),
              },
              {
                key: "listening",
                label: `Listening (${
                  _.sum(
                    data?.examCollection.data.listening.map(
                      (item) => item.exams.length
                    )
                  ) || 0
                })`,
                children: (
                  <IELTSExamLibraryTab
                    data={data?.examCollection.data.listening}
                    loading={loading || !called}
                  />
                ),
                icon: (
                  <IELTSListeningExamIcon className="inline-block" width={18} />
                ),
              },
            ]}
          />
          {data && data.examCollection.pageInfo.total >= PAGE_SIZE && (
            <Pagination
              defaultCurrent={router.query.page ? Number(router.query.page) : 1}
              total={data?.examCollection.pageInfo.total || 0}
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
              className="mt-5"
            />
          )}
        </Spin>
      </Container>
    </FormProvider>
  );
};

const IELTSExamLibraryTab = ({
  data,
  loading = true,
}: {
  data?: IExamCollection["data"]["reading" | "listening"];
  loading?: boolean;
}) => {
  return !loading && data?.length ? (
    <div className="space-y-6">
      {data.map((item) => (
        <ExamCollection key={item.id} data={item} loading={loading} />
      ))}
    </div>
  ) : (
    <>
      {loading && !data?.length ? (
        <ExamCollection />
      ) : (
        <div className="min-h-96 flex items-center justify-center">
          <Empty />
        </div>
      )}
    </>
  );
};
