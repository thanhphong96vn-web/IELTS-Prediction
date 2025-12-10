import { MyProfileLayout } from "@/widgets/layouts";
import { useQuery } from "@apollo/client";
import {
  GET_USER_PAYMENT_HISTORY,
  UserPaymentHistory,
} from "../api/getUserPaymentHistory";
import { Card, Skeleton, Table, TableProps } from "antd";
import { useMemo } from "react";
import dayjs from "dayjs";
import { currencyFormat } from "@/shared/lib";
import Link from "next/link";
import { LinkButton } from "@/shared/ui";
import { useAppContext } from "@/appx/providers";

export const PagePaymentHistory = () => {
  const {
    masterData: {
      websiteOptions: {
        websiteOptionsFields: {
          generalSettings: { buyProLink },
        },
      },
    },
  } = useAppContext();

  const { data, loading } = useQuery<UserPaymentHistory>(
    GET_USER_PAYMENT_HISTORY,
    {
      context: {
        authRequired: true,
      },
    }
  );

  const dataSource = useMemo(() => {
    return (
      (data?.viewer?.userData?.paymentHistory || []).map((item, index) => ({
        ...item,
        key: index,
      })) || []
    );
  }, [data]);

  const columns: TableProps<(typeof dataSource)[number]>["columns"] = [
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `${currencyFormat(amount)}`,
    },
    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (paymentDate) => dayjs(paymentDate).format("DD/MM/YYYY"),
    },
  ];

  return (
    <Card>
      <div className="space-y-4">
        {!loading ? (
          <Table
            dataSource={dataSource}
            size="small"
            columns={columns}
            scroll={{ x: 500 }}
          />
        ) : (
          <Skeleton active />
        )}
        <Link href={buyProLink} passHref legacyBehavior>
          <LinkButton target="_blank" type="primary">
            Buy Premium
          </LinkButton>
        </Link>
      </div>
    </Card>
  );
};

PagePaymentHistory.Layout = MyProfileLayout;
