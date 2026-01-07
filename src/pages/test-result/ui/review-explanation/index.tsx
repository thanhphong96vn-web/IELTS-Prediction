// file: index.tsx

import { Button, ConfigProvider, Splitter, Collapse } from "antd";
import { IPracticeSingle, ITestResult } from "../../api";
import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { QuestionRender } from "@/shared/ui/exam";
import { FormProvider, useForm } from "react-hook-form";
import _ from "lodash";
import parse, { HTMLReactParserOptions, domToReact } from "html-react-parser";
import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react"), { ssr: false });
import "plyr-react/plyr.css";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import { Checkbox as AntCheckbox } from "antd";

// Helper function để đếm số câu hỏi con từ một question (giống logic trong countQuestion)
const countSubQuestions = (question: any): number => {
  if (!question) return 1;

  const questionType = question.type?.[0];

  // Checkbox: đếm số đáp án đúng
  if (questionType === "checkbox") {
    const correctCount =
      question.list_of_options?.reduce(
        (acc: number, option: any) => (option.correct ? acc + 1 : acc),
        0
      ) || 0;
    return correctCount > 0 ? correctCount : 1;
  }

  // Matching: xử lý các layout khác nhau
  if (questionType === "matching" && question.matchingQuestion) {
    const layoutType = String(question.matchingQuestion.layoutType)
      .trim()
      .toLowerCase();
    if (layoutType === "summary") {
      const summaryText = question.matchingQuestion.summaryText || "";
      const gapCount = (summaryText.match(/\{(.*?)\}/g) || []).length;
      return gapCount > 0 ? gapCount : 1;
    }
    if (
      layoutType === "standard" &&
      question.matchingQuestion.matchingItems?.length > 0
    ) {
      return question.matchingQuestion.matchingItems.length;
    }
  }

  // Matrix: đếm số items
  if (questionType === "matrix" && question.matrixQuestion?.matrixItems) {
    return question.matrixQuestion.matrixItems.length;
  }

  // Fillup: đếm số gaps trong question text
  const questionText = question.question || question.instructions || "";
  if (questionText && /\{(.*?)\}/.test(questionText)) {
    const gapCount = (questionText.match(/\{(.*?)\}/g) || []).length;
    if (gapCount > 0) return gapCount;
  }

  // List of questions
  if (question.list_of_questions && question.list_of_questions.length > 0) {
    return question.list_of_questions.length;
  }

  // Explanations
  if (question.explanations && question.explanations.length > 1) {
    return question.explanations.length;
  }

  return 1;
};

type AnswerFormValues = {
  answers: (string | number[] | object)[];
};

// Hàm helper để loại bỏ thẻ span với class fill-history-correct
const removeFillHistoryCorrectTags = (text: string | undefined): string => {
  if (!text) return "";
  let cleanedText = String(text);
  // Loại bỏ các thẻ span với class fill-history-correct, chỉ giữ lại nội dung bên trong
  // Xử lý cả trường hợp class có nhiều giá trị hoặc không có dấu ngoặc kép
  cleanedText = cleanedText.replace(
    /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
    "$1"
  );
  // Xử lý thêm trường hợp nested spans (chạy 2 lần để xử lý spans lồng nhau)
  cleanedText = cleanedText.replace(
    /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
    "$1"
  );
  return cleanedText;
};

function ReviewExplanation({
  quiz,
  testResult,
}: {
  quiz: IPracticeSingle;
  testResult: ITestResult;
}) {
  const methods = useForm<AnswerFormValues>({
    defaultValues: JSON.parse(
      testResult.testResultFields.answers || '{"answers":[]}'
    ),
  });

  const [isMobileView, setIsMobileView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ▼▼▼ HeadingAnswerBlock ▼▼▼
  const HeadingAnswerBlock = ({
    userAnswer,
    correctAnswer,
  }: {
    userAnswer: string | undefined;
    correctAnswer: string;
  }) => {
    // Loại bỏ thẻ span trước khi so sánh và hiển thị
    const cleanedUserAnswer = removeFillHistoryCorrectTags(userAnswer);
    const cleanedCorrectAnswer = removeFillHistoryCorrectTags(correctAnswer);

    const isCorrect =
      cleanedUserAnswer &&
      cleanedCorrectAnswer &&
      cleanedUserAnswer.trim().toLowerCase() ===
        cleanedCorrectAnswer.trim().toLowerCase();
    const isNoAnswer = !cleanedUserAnswer || cleanedUserAnswer.trim() === "";

    if (isCorrect) {
      return (
        <div className="mb-[-15px] border border-dashed border-green-600 leading-[22px] text-[17px] font-bold text-center bg-green-50 text-green-600 p-2 py-[1px] rounded-md prose prose-sm max-w-none">
          <TextSelectionWrapper>
            {parse(cleanedCorrectAnswer)}
          </TextSelectionWrapper>
        </div>
      );
    }
    if (isNoAnswer) {
      return (
        <div className="mb-[-15px] text-[17px] leading-[22px] font-bold border border-dashed border-gray-400 text-center bg-gray-100 text-gray-500 p-2 py-[1px] rounded-md prose prose-sm max-w-none">
          <TextSelectionWrapper>
            {parse(cleanedCorrectAnswer)}
          </TextSelectionWrapper>
        </div>
      );
    }
    return (
      <div className="mb-[-15px] flex flex-row gap-2 leading-[20px] border text-center border-dashed border-red-500 bg-red-50 text-red-700 p-2 py-[1px] rounded-md prose prose-sm max-w-none">
        <div className="line-through">
          <TextSelectionWrapper>
            {parse(cleanedUserAnswer)}
          </TextSelectionWrapper>
        </div>
        <div className="text-green-600">
          <TextSelectionWrapper>
            {parse(cleanedCorrectAnswer)}
          </TextSelectionWrapper>
        </div>
      </div>
    );
  };
  // ▲▲▲ KẾT THÚC HeadingAnswerBlock ▲▲▲

  // ▼▼▼ CheckboxReviewBlock ▼▼▼
  const CheckboxReviewBlock = ({
    question,
    startIndex,
  }: {
    question: any;
    startIndex: number;
  }) => {
    // Lấy đáp án người dùng đã chọn
    const rawUserAnswer = methods.getValues(`answers.${startIndex}`);
    const userAnswers = Array.isArray(rawUserAnswer)
      ? rawUserAnswer.map((val) => Number(val)).filter((val) => !isNaN(val))
      : [];

    const subQuestionCount =
      question.list_of_options?.reduce(
        (acc: number, option: any) => (option.correct ? acc + 1 : acc),
        0
      ) || 1;

    const explanationText = question.explanations?.[0]?.content || null;

    const correctOptionIndices = useMemo(() => {
      return (question.list_of_options || [])
        .map((opt: any, index: number) => (opt.correct ? index : -1))
        .filter((index: number) => index !== -1);
    }, [question.list_of_options]);

    return (
      <div id={`#question-no-${startIndex + 1}`} className="space-y-4">
        <h3 className="text-lg font-bold">
          Questions {startIndex + 1}
          {subQuestionCount > 1 && `–${startIndex + subQuestionCount}`}
        </h3>
        <div className="leading-[2] prose prose-sm max-w-none">
          {parse(question.question || question.instructions || "")}
        </div>
        <div className="flex flex-col space-y-1">
          {(question.list_of_options || []).map(
            (option: any, index: number) => {
              const isUserSelected = userAnswers.includes(index);
              const isCorrectOption = correctOptionIndices.includes(index);

              let rowBgClass = "";
              let rowBorderClass = "border-transparent";
              let textClass = "";
              let icon = null;

              if (isUserSelected) {
                if (isCorrectOption) {
                  rowBgClass = "bg-green-100 text-green-600";
                  rowBorderClass = "border-green-300";
                  icon = (
                    <span className="material-symbols-rounded text-green-600 ml-auto">
                      check_circle
                    </span>
                  );
                } else {
                  rowBgClass = "rounded bg-[#d3e3fd] text-red-500";
                  rowBorderClass = "border-red-300";
                  icon = (
                    <span className="material-symbols-rounded text-red-600 ml-auto">
                      cancel
                    </span>
                  );
                }
              } else {
                if (isCorrectOption) {
                  textClass = "text-green-600";
                }
              }

              return (
                <div
                  key={index}
                  className={twMerge(
                    "flex items-center px-[15px] py-[3px] rounded",
                    rowBgClass,
                    rowBorderClass
                  )}
                >
                  <AntCheckbox
                    checked={isUserSelected}
                    disabled
                    className="mr-2 pointer-events-none"
                  />
                  <span className={twMerge("flex-grow", textClass)}>
                    <TextSelectionWrapper>
                      {parse(option.option)}
                    </TextSelectionWrapper>
                  </span>
                  {icon}
                </div>
              );
            }
          )}
        </div>
        {explanationText && (
          <Collapse
            className="mt-4"
            items={[
              {
                key: "1",
                label: "Explanation",
                children: (
                  <div className="prose prose-sm max-w-none">
                    {parse(explanationText)}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    );
  };
  // ▲▲▲ KẾT THÚC CheckboxReviewBlock ▲▲▲

  // ▼▼▼ LOGIC newPost ▼▼▼
  const newPost = useMemo(() => {
    const rawPost = JSON.parse(JSON.stringify(quiz));

    // BƯỚC 1: Tính startIndex cho TẤT CẢ passages TRƯỚC (giống như khi làm bài)
    // Để đảm bảo index khớp với đáp án đã lưu
    let currentIndex = 0;
    rawPost.quizFields.passages.forEach(
      (passage: any, passageIndex: number) => {
        if (passage && passage.questions) {
          passage.questions.forEach((question: any, questionIndex: number) => {
            _.set(
              rawPost,
              `quizFields.passages.${passageIndex}.questions.${questionIndex}.startIndex`,
              currentIndex
            );
            const questionType = question.type?.[0];

            // Debug: Log startIndex được gán
            // Dùng helper function để đảm bảo logic nhất quán với khi làm bài
            const numberOfSubQuestions = countSubQuestions(question);
            currentIndex += numberOfSubQuestions;
          });
        }
      }
    );

    // BƯỚC 2: Filter passages SAU KHI tính startIndex (giống như khi làm bài)
    const testParts = JSON.parse(testResult.testResultFields.testPart);
    rawPost.quizFields.passages = rawPost.quizFields.passages.filter(
      (_: any, index: number) => testParts.includes(index)
    );

    return rawPost;
  }, [quiz, testResult.testResultFields.testPart]);
  // ▲▲▲ KẾT THÚC newPost ▲▲▲

  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  const currentPassage = useMemo(() => {
    return newPost.quizFields.passages[currentPassageIndex];
  }, [newPost, currentPassageIndex]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ▼▼▼ LOGIC processedPassageComponent (ĐÃ SỬA LỖI STYLE) ▼▼▼
  const processedPassageComponent = useMemo(() => {
    if (!currentPassage?.passage_content) return null;

    const headingQuestion = currentPassage.questions.find((q: any) => {
      if (q.type?.[0] !== "matching") return false;
      const layoutValue = q.matchingQuestion?.layoutType;
      const layout = Array.isArray(layoutValue)
        ? layoutValue[0]
        : String(layoutValue || "")
            .trim()
            .toLowerCase();
      return layout === "heading";
    });

    if (!headingQuestion) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: currentPassage.passage_content,
          }}
        />
      );
    }

    try {
      const startIndex = headingQuestion.startIndex || 0;
      const answerOptions =
        headingQuestion.matchingQuestion?.answerOptions || [];
      const userAnswers = methods.getValues(`answers.${startIndex}`) as
        | { [key: string]: number | string }
        | undefined;
      let headingIndex = -1;

      const parserOptions: HTMLReactParserOptions = {
        replace: (domNode: any) => {
          if (domNode.type === "tag" && domNode.name === "p") {
            const firstChild = domNode.children?.[0];

            if (
              firstChild &&
              firstChild.type === "text" &&
              firstChild.data.startsWith("{")
            ) {
              headingIndex++;
              const currentItemIndex = headingIndex;

              let correctAnswerText = "";
              const match = firstChild.data.match(/\{(.*?)\}/);
              if (match && match[1]) {
                correctAnswerText = match[1];
              }

              let userAnswerText: string | undefined = undefined;
              if (userAnswers && userAnswers[currentItemIndex] !== undefined) {
                const savedValue = userAnswers[currentItemIndex];

                if (typeof savedValue === "number") {
                  const optionIndex = savedValue;
                  userAnswerText = answerOptions[optionIndex]?.optionText;
                } else if (
                  typeof savedValue === "string" &&
                  savedValue.startsWith("option-")
                ) {
                  try {
                    const optionIndex = parseInt(savedValue.split("-")[2]);
                    userAnswerText = answerOptions[optionIndex]?.optionText;
                  } catch (e) {
                    userAnswerText = undefined;
                  }
                }
              }

              firstChild.data = firstChild.data.replace(/\{(.*?)\}/, "");

              // --- SỬA LỖI STYLE Ở ĐÂY ---
              // Tách bỏ 'style' ra khỏi attributes để tránh lỗi React khi render
              const { style, ...restAttribs } = domNode.attribs || {};

              return (
                <>
                  <HeadingAnswerBlock
                    userAnswer={userAnswerText}
                    correctAnswer={correctAnswerText}
                  />
                  {/* Sử dụng restAttribs thay vì domNode.attribs */}
                  <p {...restAttribs}>
                    {domToReact(domNode.children, parserOptions)}
                  </p>
                </>
              );
            }
          }
          return domNode;
        },
      };

      return parse(currentPassage.passage_content, parserOptions);
    } catch (error) {
      console.error("Error processing heading passage:", error);
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: currentPassage.passage_content,
          }}
        />
      );
    }
  }, [currentPassage, methods]);
  // ▲▲▲ KẾT THÚC 'processedPassageComponent' ▲▲▲

  const hasPrevPassage = useMemo(
    () => currentPassageIndex > 0,
    [currentPassageIndex]
  );
  const hasNextPassage = useMemo(
    () => currentPassageIndex < newPost.quizFields.passages.length - 1,
    [currentPassageIndex, newPost.quizFields.passages]
  );

  const handlePrevPassage = () => {
    if (hasPrevPassage) setCurrentPassageIndex(currentPassageIndex - 1);
  };
  const handleNextPassage = () => {
    if (hasNextPassage) setCurrentPassageIndex(currentPassageIndex + 1);
  };

  const PlyrComponent = useMemo(() => {
    if (!quiz.quizFields.audio) return null;
    return (
      <Plyr
        source={{
          type: "audio",
          sources: [
            {
              src: quiz.quizFields.audio!.node.mediaItemUrl,
              type: "audio/mp3",
            },
          ],
        }}
      />
    );
  }, [quiz.quizFields.audio]);

  // ▼▼▼ ExplanationsPanelContent ▼▼▼
  const ExplanationsPanelContent = useMemo(() => {
    if (!currentPassage || !currentPassage.questions) {
      return (
        <div className="p-4 md:px-0 text-gray-500">No passage/questions</div>
      );
    }

    const allHtml: string[] = [];
    let hasAnyExplanation = false;

    currentPassage.questions.forEach((q: any, questionIndex: number) => {
      if (Array.isArray(q.explanations) && q.explanations.length > 0) {
        let subQuestionCount = 1;
        const questionType = q.type?.[0];
        let isFillup = false;

        const questionText = q.question || q.instructions || "";
        let gapCount = 0;
        const gapMatches = questionText.match(/\{(.*?)\}/g);
        if (gapMatches) {
          gapCount = gapMatches.length;
        }

        if (gapCount > 0) {
          subQuestionCount = gapCount;
          if (q.explanations.length > 1) {
            isFillup = true;
          } else {
            isFillup = false;
          }
        } else if (q.list_of_questions && q.list_of_questions.length > 0) {
          subQuestionCount = q.list_of_questions.length;
        } else if (questionType === "checkbox") {
          subQuestionCount =
            q.list_of_options?.reduce(
              (acc: number, option: any) => (option.correct ? acc + 1 : acc),
              0
            ) || 1;
          // Với checkbox có nhiều đáp án đúng, mỗi explanation tương ứng với một câu hỏi
          if (q.explanations.length > 1) {
            isFillup = true;
          }
        } else if (q.explanations.length > 1) {
          subQuestionCount = q.explanations.length;
          isFillup = true;
        }

        const contentHtml = q.explanations
          .map((exp: any, index: number) => {
            let text = exp?.content;
            if (text && String(text).trim() !== "") {
              hasAnyExplanation = true;

              // Loại bỏ các thẻ span với class fill-history-correct, chỉ giữ lại nội dung bên trong
              // Xử lý cả trường hợp class có nhiều giá trị hoặc không có dấu ngoặc kép
              text = String(text).replace(
                /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
                "$1"
              );
              // Xử lý thêm trường hợp nested spans
              text = String(text).replace(
                /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
                "$1"
              );

              let resultHtml = "";
              // Với checkbox có nhiều đáp án đúng, mỗi explanation tương ứng với một câu hỏi
              // Tính số câu hỏi dựa trên startIndex và index của explanation
              if (
                isFillup ||
                (questionType === "checkbox" && q.explanations.length > 1)
              ) {
                const questionNumber = q.startIndex + 1 + index;
                resultHtml = `<p><b>Q.${questionNumber}:</b> ${text}</p>`;
              } else {
                resultHtml = `<p>${text}</p>`;
              }

              return resultHtml;
            }
            return null;
          })
          .filter(Boolean)
          .join("");

        if (contentHtml) {
          allHtml.push(contentHtml);
        }
      }
    });

    if (!hasAnyExplanation) {
      return (
        <div className="text-gray-500">
          No explanations available for this part.
        </div>
      );
    }

    return (
      <div className="">
        <h3 className="text-xl font-bold text-primary md:px-12">
          Explanations
        </h3>
        <div className="space-y-2 px-1">
          <div className="prose prose-sm max-w-none">
            {parse(allHtml.join('<hr class="my-3"/>'))}
          </div>
        </div>
      </div>
    );
  }, [currentPassage]);
  // ▲▲▲ KẾT THÚC ExplanationsPanelContent ▲▲▲

  // ▼▼▼ QuestionsPanelContent ▼▼▼
  const QuestionsPanelContent = useMemo(() => {
    return (
      <ConfigProvider>
        <FormProvider {...methods}>
          <div className={twMerge("p-4 md:p-12 space-y-6 bg-white")}>
            {currentPassage.questions &&
              currentPassage.questions.map((question, index) => {
                const questionType = question.type?.[0];
                if (questionType === "checkbox") {
                  return (
                    <CheckboxReviewBlock
                      key={`${currentPassageIndex}-${index}-review`}
                      question={question}
                      startIndex={question.startIndex}
                    />
                  );
                }
                return (
                  <QuestionRender
                    key={`${currentPassageIndex}-${index}`}
                    question={question}
                    startIndex={question.startIndex}
                    readOnly
                  />
                );
              })}
          </div>
        </FormProvider>
      </ConfigProvider>
    );
  }, [methods, currentPassage, currentPassageIndex]);
  // ▲▲▲ KẾT THÚC QuestionsPanelContent ▲▲▲

  if (!currentPassage) {
    return <div>Loading review...</div>;
  }

  const isReading = quiz.quizFields.skill[0] === "reading";
  const isListening = quiz.quizFields.skill[0] === "listening";

  // Effect để fix menu settings bị clip khi Plyr được render
  useEffect(() => {
    if (!isListening) return;
    
    const fixPlyrMenu = () => {
      // Tìm tất cả menu của Plyr và đảm bảo chúng không bị clip
      const plyrMenus = document.querySelectorAll('.plyr__menu');
      plyrMenus.forEach((menu: any) => {
        if (menu) {
          menu.style.overflow = 'visible';
          menu.style.zIndex = '10000';
          menu.style.position = 'absolute';
          menu.style.clip = 'unset';
          menu.style.clipPath = 'none';
          menu.style.maxHeight = 'none';
          menu.style.height = 'auto';
        }
      });
      
      // Đảm bảo container không clip
      const plyrContainers = document.querySelectorAll('.plyr__menu__container');
      plyrContainers.forEach((container: any) => {
        if (container) {
          container.style.overflow = 'visible';
          container.style.zIndex = '10000';
          container.style.clip = 'unset';
          container.style.clipPath = 'none';
          container.style.maxHeight = 'none';
        }
      });
      
      // Đảm bảo settings button container không clip
      const settingsButtons = document.querySelectorAll('[data-plyr="settings"]');
      settingsButtons.forEach((button: any) => {
        if (button) {
          button.style.overflow = 'visible';
          button.style.zIndex = '10000';
          button.style.clip = 'unset';
          button.style.clipPath = 'none';
        }
      });
      
      // Đảm bảo tất cả parent containers không clip
      const allParents = document.querySelectorAll('.plyr, .plyr__controls, .plyr__controls__item');
      allParents.forEach((parent: any) => {
        if (parent) {
          const computedStyle = window.getComputedStyle(parent);
          if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'hidden' || computedStyle.overflowX === 'hidden') {
            parent.style.overflow = 'visible';
            parent.style.overflowY = 'visible';
            parent.style.overflowX = 'visible';
          }
        }
      });
      
      // Tìm và fix Splitter.Panel nếu có
      const splitterPanels = document.querySelectorAll('.ant-split-panel');
      splitterPanels.forEach((panel: any) => {
        if (panel && panel.querySelector('.plyr')) {
          const computedStyle = window.getComputedStyle(panel);
          if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'hidden') {
            panel.style.overflow = 'visible';
            panel.style.overflowY = 'visible';
          }
          // Fix tất cả children của panel
          const panelChildren = panel.querySelectorAll('*');
          panelChildren.forEach((child: any) => {
            if (child && child !== panel.querySelector('.plyr') && !child.closest('.plyr')) {
              const childStyle = window.getComputedStyle(child);
              if (childStyle.overflow === 'hidden' && child !== panel.querySelector('.plyr__menu')) {
                // Chỉ fix nếu không phải là explanations scrollable area
                if (!child.classList.contains('ex-right') && !child.closest('.ex-right')) {
                  // Không làm gì, giữ nguyên overflow cho explanations
                }
              }
            }
          });
        }
      });
      
      // Fix Splitter container
      const splitter = document.querySelector('.ant-split') as HTMLElement;
      if (splitter) {
        const computedStyle = window.getComputedStyle(splitter);
        if (computedStyle.overflow === 'hidden') {
          splitter.style.overflow = 'visible';
        }
      }
    };
    
    // Fix ngay khi component mount
    const timer = setTimeout(fixPlyrMenu, 100);
    
    // Fix khi menu mở (observe mutations) - chạy liên tục
    const observer = new MutationObserver(() => {
      fixPlyrMenu();
    });
    const plyrElement = document.querySelector('.plyr');
    if (plyrElement) {
      observer.observe(plyrElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
    
    // Fix khi click vào settings button
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-plyr="settings"]') || target.closest('.plyr__menu')) {
        setTimeout(fixPlyrMenu, 10);
      }
    };
    document.addEventListener('click', handleClick, true);
    
    // Fix khi hover vào settings button
    const handleMouseEnter = () => {
      setTimeout(fixPlyrMenu, 10);
    };
    const settingsButton = document.querySelector('[data-plyr="settings"]');
    if (settingsButton) {
      settingsButton.addEventListener('mouseenter', handleMouseEnter);
    }
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
      if (settingsButton) {
        settingsButton.removeEventListener('mouseenter', handleMouseEnter);
      }
    };
  }, [isListening, PlyrComponent]);

  return (
    <>
      <Splitter
        layout={isMobileView ? "vertical" : undefined}
        className="h-[600px] border-t"
      >
        {/* PANEL 1 (BÊN TRÁI) */}
        <Splitter.Panel
          min="40%"
          max="60%"
          className="relative overflow-y-auto"
        >
          {/* 1a. NẾU LÀ READING: Hiển thị Passage */}
          {isReading && (
            <div className="prose prose-sm max-w-none p-4 md:p-12 bg-white">
              <h2 className="text-primary text-2xl font-bold">
                {currentPassage.title}
              </h2>
              {processedPassageComponent}
            </div>
          )}

          {/* 1b. NẾU LÀ LISTENING: Hiển thị Câu hỏi (ẩn explanation bằng CSS) */}
          {isListening && (
            <div className="overflow-y-auto h-full relative">
              <style>{`
                #left-question-panel .ant-collapse {
                    display: none !important;
                }
              `}</style>
              <div id="left-question-panel">{QuestionsPanelContent}</div>
            </div>
          )}
        </Splitter.Panel>

        {/* PANEL 2 (BÊN PHẢI) */}
        <Splitter.Panel className="relative" style={{ overflow: 'visible' }}>
          {/* 2a. NẾU LÀ READING: Hiển thị Câu hỏi */}
          {isReading && (
            <div className="overflow-y-auto h-[calc(600px-50px)]">
              {QuestionsPanelContent}
            </div>
          )}

          {/* 2b. NẾU LÀ LISTENING: Hiển thị Audio & Explanations */}
          {isListening && (
            <div className="h-[calc(600px-50px)] relative flex flex-col" style={{ overflow: 'visible' }}>
              {/* Audio player - không scroll, overflow visible để menu settings không bị che */}
              <div ref={ref} className="p-4 md:p-12 flex-shrink-0" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
                <div style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
                  {PlyrComponent}
                </div>
              </div>
              {/* Explanations - scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowX: 'visible' }}>
                <div className="ex-right">{ExplanationsPanelContent}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-100 flex justify-between items-center px-4 py-2 border-t">
            <p className="font-semibold text-primary line-clamp-1">
              {currentPassage.title}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                disabled={!hasPrevPassage}
                onClick={handlePrevPassage}
              >
                <span className="material-symbols-rounded">chevron_left</span>
                <span>Previous</span>
              </Button>
              <Button
                type="primary"
                disabled={!hasNextPassage}
                onClick={handleNextPassage}
              >
                <span>Next</span>
                <span className="material-symbols-rounded">chevron_right</span>
              </Button>
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>
    </>
  );
}

export default ReviewExplanation;
