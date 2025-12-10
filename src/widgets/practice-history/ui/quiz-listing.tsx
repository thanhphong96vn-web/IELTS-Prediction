import { useLazyQuery } from "@apollo/client";
import { Progress, Table, TableProps } from "antd";
import {
  GET_PRACTICE_HISTORY,
  GetPracticeHistory,
  GetPracticeHistoryVariables,
} from "../api";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/appx/providers";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { calculateScore } from "@/shared/lib";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
dayjs.extend(duration);

const calcTimeTaken = (testTime: string, timeLeft: string) => {
  const total = dayjs.duration({
    minutes: Number(testTime),
  });

  const [minutes, seconds] = timeLeft.split(":").map(Number);
  const remainingDuration = dayjs.duration({ minutes, seconds });
  const spent = total.subtract(remainingDuration);
  const percent = Math.round((spent.asMinutes() / total.asMinutes()) * 100);

  const formattedTime = `${spent.minutes() + spent.hours() * 60}:${String(
    spent.seconds()
  ).padStart(2, "0")}`;

  const totalTime = `${Number(total.minutes()) + total.hours() * 60}:${String(
    total.seconds()
  ).padStart(2, "0")}`;

  return {
    totalTime,
    spent: formattedTime,
    percent,
  };
};

export const QuizListing = ({ skill }: { skill: "listening" | "reading" }) => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  const [getData, { data, loading }] = useLazyQuery<
    GetPracticeHistory,
    GetPracticeHistoryVariables
  >(GET_PRACTICE_HISTORY, {
    context: {
      authRequired: true,
    },
  });

  const columns: TableProps<
    GetPracticeHistory["testResults"]["edges"][number]["node"]
  >["columns"] = [
      {
        title: "Quiz",
        dataIndex: ["testResultFields", "quiz", "node", "title"],
        key: "quiz",
      },
      {
        title: <div className="text-center">Taken on</div>,
        dataIndex: ["testResultFields", "dateTaken"],
        key: "dateTaken",
        render: (dateSubmitted) => (
          <div className="text-center">
            <p>{dayjs.unix(dateSubmitted).format("DD/MM/YYYY")}</p>
            <span className="text-gray-600 text-xs">
              {dayjs.unix(dateSubmitted).format("HH:mm:ss")}
            </span>
          </div>
        ),
      },
      {
        title: "Time Taken",
        key: "timeTaken",
        render: (_, record) =>
          calcTimeTaken(
            record.testResultFields.testTime,
            record.testResultFields.timeLeft
          ).spent,
      },
      {
        title: "Questions",
        key: "questions",
        dataIndex: ["testResultFields", "quiz", "node", "quizFields", "passages"],
        render: (_, record) =>
          record.testResultFields.quiz.node.quizFields.passages.reduce(
            (acc, passage) =>
              acc +
              passage.questions.reduce(
                (acc, question) => acc + question.explanations.length,
                0
              ),
            0
          ),
      },
      {
        title: "Correct",
        key: "correctAnswers",
        render: (_, record) =>
          calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            record.testResultFields.testPart
          ).correctAns,
      },
      {
        title: "Incorrect",
        key: "incorrectAnswers",
        render: (_, record) =>
          calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            record.testResultFields.testPart
          ).incorrect,
      },
      {
        title: "Missed",
        key: "missedAnswers",
        render: (_, record) =>
          calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            record.testResultFields.testPart
          ).missed,
      },
      {
        title: "Correct Percent",
        key: "correctPercent",
        render: (_, record) => {
          const percent = calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            record.testResultFields.testPart
          ).correctPercent;

          return (
            <>
              <span>{Math.round(percent)}%</span>
              <Progress percent={percent} showInfo={false} />
            </>
          );
        },
      },
      {
        key: "details",
        render: (_, record) => (
          <Link href={ROUTES.TEST_RESULT(record.id)}>View</Link>
        ),
      },
    ];

  const dataSource = useMemo(() => {
    if (data) {
      return data.testResults.edges.map((item, idx) => {
        return {
          ...item.node,
          key: idx,
        };
      });
    }
    return [];
  }, [data]);

  useEffect(() => {
    getData({
      variables: {
        quizSkill: skill,
        authorId: currentUser!.id,
        offset: 0,
        size: 5,
      },
    });
  }, [currentUser, getData, skill]);

  const handleTableChange: TableProps<
    GetPracticeHistory["testResults"]["edges"][number]["node"]
  >["onChange"] = (pagination) => {
    const current = pagination.current || 1;
    const pageSize = pagination.pageSize || 1;

    setCurrentPage(current);
    getData({
      variables: {
        quizSkill: skill,
        authorId: currentUser!.id,
        offset: (current - 1) * pageSize,
        size: pagination.pageSize,
      },
    });
  };

  return (
    <Table<GetPracticeHistory["testResults"]["edges"][number]["node"]>
      columns={columns}
      dataSource={dataSource}
      scroll={{ x: 768 }}
      loading={loading}
      size="small"
      pagination={{
        current: currentPage,
        pageSize: 5,
        total: data?.testResults.pageInfo.offsetPagination.total,
      }}
      onChange={handleTableChange}
    />
  );
};
