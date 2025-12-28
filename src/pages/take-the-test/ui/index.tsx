// file: .../pages/take-the-test/ui/index.tsx (FULL CODE ĐÃ SỬA)

import { BlankLayout } from "@/widgets/layouts";
import Header from "./header";
import { Splitter } from "antd";
import {
  AnswerFormValues,
  ExamContext,
  ExamProvider,
  useExamContext,
} from "../context";

import {
  QuestionRender,
  DraggableOption,
  SummaryDroppableSlot,
} from "@/shared/ui/exam";

import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { useEffect, useMemo, useState, useRef } from "react";
import _ from "lodash";
import Footer from "./footer";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { useMutation } from "@apollo/client";
import { IDraftResponse, ITestResult, SAVE_DRAFT } from "../api";
import dayjs from "dayjs";
import { TextSelectionProvider, TextSelectionWrapper } from "@/shared/ui";
import Notepad from "./notepad";
import parse from "html-react-parser";
import { countQuestion } from "@/shared/lib";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
  rectIntersection,
  DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

// ==================================================================
// COMPONENT RENDER PASSAGE CHO 'HEADING'
// ==================================================================
function PassageRenderer({ passageContent }: { passageContent: string }) {
  // @ts-ignore
  const {
    items,
    overId,
    activeQuestionIndex,
    setActiveQuestionIndex,
    answerOptions,
    startIndex,
  } = useExamContext();

  const { processedText, totalGaps } = useMemo(() => {
    let gapCount = 0;
    const textToRender = (passageContent || "").replace(
      /\{(.*?)\}/g,
      (match, answer) => {
        const currentGapIndex = gapCount;
        gapCount++;
        return `<span data-gap-index="${currentGapIndex}"></span>`;
      }
    );
    return { processedText: textToRender, totalGaps: gapCount };
  }, [passageContent]);

  if (!items || !answerOptions || totalGaps === 0) {
    return (
      <TextSelectionWrapper>{parse(passageContent || "")}</TextSelectionWrapper>
    );
  }

  const parserOptions = {
    replace: (domNode: any) => {
      if (
        domNode.name === "span" &&
        domNode.attribs &&
        domNode.attribs["data-gap-index"] !== undefined
      ) {
        const gapIndex = parseInt(domNode.attribs["data-gap-index"], 10);
        if (isNaN(gapIndex)) return;

        const containerId = `gap-${gapIndex}`;
        const questionNumber = startIndex + gapIndex + 1;
        const questionAbsoluteIndex = startIndex + gapIndex;

        return (
          <SortableContext items={items[containerId] || []} id={containerId}>
            <SummaryDroppableSlot
              id={containerId}
              isOver={overId === containerId}
              questionNumber={questionNumber}
              onClick={() => setActiveQuestionIndex(questionAbsoluteIndex)}
              isSelected={activeQuestionIndex === questionAbsoluteIndex}
            >
              {(items[containerId] || []).map((optionId: UniqueIdentifier) => {
                const optionIndex = parseInt(String(optionId).split("-")[2]);
                if (isNaN(optionIndex)) return null;
                // @ts-ignore
                const option = answerOptions[optionIndex];
                if (!option) return null;
                return (
                  <DraggableOption
                    key={optionId}
                    id={optionId}
                    content={option.optionText}
                    isDropped
                    className="px-1"
                  />
                );
              })}
            </SummaryDroppableSlot>
          </SortableContext>
        );
      }
    },
  };

  return (
    <TextSelectionWrapper>
      {parse(processedText, parserOptions)}
    </TextSelectionWrapper>
  );
}

const findContainer = (
  items: Record<string, UniqueIdentifier[]>,
  id: UniqueIdentifier
) => {
  if (!id) return undefined;
  if (id in items) return id as string;
  return Object.keys(items).find((key) => items[key].includes(id));
};

// ==================================================================
// COMPONENT WRAPPER
// ==================================================================
export function PageTakeTheTestWrapper({
  post,
  testID,
  testResult: { testResultFields },
}: {
  post: IPracticeSingle;
  testID: string;
  testResult: ITestResult;
}) {
  const methods = useForm<AnswerFormValues>({
    defaultValues: {
      answers: (
        JSON.parse(testResultFields.answers || '{"answers":[]}') as {
          answers: (string | number[] | object)[];
        }
      ).answers.map((a) => a || ""),
    },
  });

  const newPost = useMemo(() => {
    let currentIndex = 0;
    const rawPost = JSON.parse(JSON.stringify(post));

    rawPost.quizFields.passages.forEach(
      (passage: any, passageIndex: number) => {
        _.set(
          rawPost,
          `quizFields.passages.${passageIndex}.partIndex`,
          passageIndex
        );

        passage.questions.forEach((question: any, questionIndex: number) => {
          _.set(
            rawPost,
            `quizFields.passages.${passageIndex}.questions.${questionIndex}.startIndex`,
            currentIndex
          );

          const numberOfSubQuestions = countQuestion({ questions: [question] });

          currentIndex += numberOfSubQuestions;
        });
      }
    );

    _.set(rawPost, "quizFields.time", testResultFields.testTime);
    const parts: number[] = JSON.parse(testResultFields.testPart || "[]");
    const newPostData = {
      ...rawPost,
      quizFields: {
        ...rawPost.quizFields,
        passages: rawPost.quizFields.passages.filter(
          (_: any, index: number) => {
            return parts.includes(index);
          }
        ),
      },
    };
    return newPostData;
  }, [post, testResultFields.testPart, testResultFields.testTime]);

  return (
    <ExamProvider post={newPost} testID={testID} testResult={testResultFields}>
      <FormProvider {...methods}>
        <PageTakeTheTest />
      </FormProvider>
    </ExamProvider>
  );
}

PageTakeTheTestWrapper.Layout = BlankLayout;

// ==================================================================
// COMPONENT PAGE CHÍNH (ĐÃ SỬA KEY)
// ==================================================================
export function PageTakeTheTest() {
  const examContext = useExamContext();
  const {
    part, 
    post,
    isFormDisabled,
    testID,
    isReady,
    setFormDisabled,
    handleSubmitAnswer,
    isNotesViewOpen,
    setIsNotesViewOpen,
    timer,
    selectedTextSize,
    ...restOfContext
  } = examContext;

  const {
    handleSubmit,
    getValues,
    setValue,
    formState: { isSubmitting, isSubmitted },
  } = useFormContext<AnswerFormValues>();

  const [isMobileView, setIsMobileView] = useState(false);
  const questionPanelRef = useRef<HTMLDivElement>(null);

  const [saveDraftFn] = useMutation<
    IDraftResponse,
    { answers: string; testId: string; timeLeft: string }
  >(SAVE_DRAFT, {
    context: { authRequired: true },
    onError: (err) => {
      console.warn("Auto-save Mutation Error Handled:", err);
    }
  });

  const currentPassage = useMemo(
    () =>
      post.quizFields.passages.find(
        (p) => (p as any).partIndex === part.current
      ),
    [part, post.quizFields.passages]
  );

  const passageInfo = useMemo(() => {
    if (
      !currentPassage ||
      !currentPassage.questions ||
      currentPassage.questions.length === 0
    ) {
      return { partLabel: "", partNumber: 0, questionRange: "" };
    }
    const partLabel =
      post.quizFields.skill[0] === "reading" ? "Passage" : "Part";
    const partNumber = (currentPassage as any).partIndex + 1;
    const startQuestion = currentPassage.questions[0]?.startIndex + 1;
    const questionCountInPassage = countQuestion(currentPassage);
    const endQuestion = startQuestion + questionCountInPassage - 1;
    const questionRange =
      questionCountInPassage <= 1
        ? `${startQuestion}`
        : `${startQuestion}-${endQuestion}`;
    return { partLabel, partNumber, questionRange };
  }, [currentPassage, post.quizFields.skill]);

  useEffect(() => {
    document.documentElement.style.overflowY = "hidden";
    document.body.style.overflowY = "hidden";
    return () => {
      document.documentElement.style.overflowY = "";
      document.body.style.overflowY = "";
    };
  }, []);

  const headingQuestion = useMemo(
    () =>
      currentPassage?.questions.find(
        (q: any) =>
          String(q.matchingQuestion?.layoutType).trim().toLowerCase() ===
          "heading"
      ),
    [currentPassage]
  );

  const { answerOptions, startIndex, totalGaps, correctAnswers } =
    useMemo(() => {
      if (!headingQuestion || !currentPassage) {
        return {
          answerOptions: [],
          startIndex: 0,
          totalGaps: 0,
          correctAnswers: [],
        };
      }

      const options = headingQuestion.matchingQuestion.answerOptions || [];
      // @ts-ignore
      const sIndex = headingQuestion.startIndex || 0;

      let gapCount = 0;
      const answers: string[] = [];
      (currentPassage.passage_content || "").replace(
        /\{(.*?)\}/g,
        (match, answer) => {
          answers.push(answer.trim());
          gapCount++;
          return "";
        }
      );

      return {
        answerOptions: options,
        startIndex: sIndex,
        totalGaps: gapCount,
        correctAnswers: answers,
      };
    }, [headingQuestion, currentPassage]);

  const [items, setItems] = useState<Record<string, UniqueIdentifier[]>>({
    available: [],
  });
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (!headingQuestion) {
      setItems({ available: [] });
      return;
    }

    const formAnswers = (getValues(`answers.${startIndex}`) || {}) as {
      [key: number]: string;
    };
    const newItems: Record<string, UniqueIdentifier[]> = { available: [] };
    for (let i = 0; i < totalGaps; i++) {
      newItems[`gap-${i}`] = [];
    }

    const droppedOptionIds = new Set<string>();

    if (formAnswers && typeof formAnswers === "object") {
      for (const gapKey in formAnswers) {
        const optionId = formAnswers[gapKey];
        if (optionId) {
          const gapIndex = parseInt(gapKey, 10);
          if (!isNaN(gapIndex) && newItems[`gap-${gapIndex}`]) {
            newItems[`gap-${gapIndex}`] = [optionId];
            droppedOptionIds.add(optionId);
          }
        }
      }
    }

    answerOptions.forEach((_, optionIndex) => {
      const optionId = `option-${startIndex}-${optionIndex}`;
      if (!droppedOptionIds.has(optionId)) {
        newItems["available"].push(optionId);
      }
    });

    setItems(newItems);
  }, [headingQuestion, totalGaps, answerOptions, startIndex, getValues]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;

    const activeContainer = findContainer(items, active.id);
    let overContainerId: string | undefined;

    if (over) {
      overContainerId =
        over.id in items ? (over.id as string) : findContainer(items, over.id);
    } else {
      if (activeContainer && activeContainer !== "available") {
        overContainerId = "available";
      } else {
        return;
      }
    }

    if (
      !activeContainer ||
      !overContainerId ||
      activeContainer === overContainerId
    ) {
      return;
    }

    const newItems = { ...items };
    newItems[activeContainer] = newItems[activeContainer].filter(
      (id) => id !== active.id
    );

    if (
      String(overContainerId).startsWith("gap-") &&
      newItems[overContainerId]?.length > 0
    ) {
      const existingItemId = newItems[overContainerId][0];
      newItems[overContainerId] = [];
      if (!newItems["available"]) newItems["available"] = [];
      newItems["available"].push(existingItemId);
    }

    if (String(overContainerId).startsWith("gap-")) {
      newItems[overContainerId] = [active.id];
    } else {
      if (!newItems["available"]) newItems["available"] = [];
      if (!newItems["available"].includes(active.id)) {
        newItems["available"].push(active.id);
      }
    }
    setItems(newItems);

    const currentFormAnswers = (getValues(`answers.${startIndex}`) || {}) as {
      [key: number]: string;
    };
    let updatedFormAnswers = { ...currentFormAnswers };

    Object.keys(updatedFormAnswers).forEach((key) => {
      if (updatedFormAnswers[key as any] === active.id) {
        delete updatedFormAnswers[key as any];
      }
    });

    if (String(overContainerId).startsWith("gap-")) {
      const gapIndex = String(overContainerId).split("-")[1];
      if (gapIndex && !isNaN(parseInt(gapIndex, 10))) {
        updatedFormAnswers[gapIndex] = active.id as string;
        restOfContext.setActiveQuestionIndex(
          startIndex + parseInt(gapIndex, 10)
        );
      }
    }

    setValue(`answers.${startIndex}`, updatedFormAnswers, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const newContextValue = {
    ...restOfContext,
    part,
    post,
    isFormDisabled,
    testID,
    isReady,
    setFormDisabled,
    handleSubmitAnswer,
    isNotesViewOpen,
    setIsNotesViewOpen,
    timer,
    selectedTextSize,
    items,
    setItems,
    overId,
    activeId,
    answerOptions,
    startIndex,
  };

  if (!currentPassage) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading passage or passage not found...
      </div>
    );
  }

  useEffect(() => {
    document.documentElement.className = "";
    document.documentElement.classList.add(`text-size-${selectedTextSize}`);
  }, [selectedTextSize]);

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

  useEffect(() => {
    if (!isReady || isSubmitting || isSubmitted) return;
    const interval = setInterval(() => {
      if (isSubmitting || isSubmitted) return;

      saveDraftFn({
        variables: {
          answers: JSON.stringify(getValues()),
          testId: testID,
          timeLeft:
            timer?.format("mm:ss") ||
            dayjs(post.quizFields.time, "mm").format("mm:ss"),
        },
      }).catch((err) => {
        console.warn("Auto-save silently failed", err);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [
    getValues,
    isReady,
    post.quizFields.time,
    saveDraftFn,
    testID,
    timer,
    isSubmitting,
    isSubmitted,
  ]);

  useEffect(() => {
    if (isSubmitted || isSubmitting) setFormDisabled(true);
  }, [isSubmitted, isSubmitting, setFormDisabled]);

  useEffect(() => {
    if (isMobileView && setIsNotesViewOpen && isNotesViewOpen) {
      setIsNotesViewOpen(false);
    }
  }, [isMobileView, isNotesViewOpen, setIsNotesViewOpen]);

  useEffect(() => {
    if (questionPanelRef.current) {
      questionPanelRef.current.scrollTop = 0;
    }
  }, [currentPassage]);

  return (
    <>
      {/* Render AudioPlayer outside TextSelectionProvider to prevent unmounting */}
      <form onSubmit={handleSubmit(handleSubmitAnswer)}>
        <div className="flex flex-col h-screen">
          <Header post={post} />
          
          {/* 🔥 FIX QUAN TRỌNG: ĐẶT key={part.current} ĐỂ BUỘC UNMOUNT/MOUNT */}
          <TextSelectionProvider key={part.current}>
            <main className="shrink grow overflow-hidden flex flex-col pb-[60px]">
              <div className="border border-[#d5d5d5] rounded-[4px] flex-shrink-0 m-[16px] bg-[#f1f2ec]">
                <div className="p-[16px]">
                  <div className="font-bold text-gray-800 text-base md:text-lg leading-tight">
                    {passageInfo.partLabel} {passageInfo.partNumber}
                  </div>
                  <div className="text-[#000] text-base">
                    Read the text and answer questions {passageInfo.questionRange}
                  </div>
                </div>
              </div>

              <ExamContext.Provider value={newContextValue}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={rectIntersection}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex h-full flex-grow min-h-0">
                    <div
                      className={twMerge(
                        "w-full duration-300",
                        isNotesViewOpen && "w-10/12"
                      )}
                    >
                      <Splitter layout={isMobileView ? "vertical" : undefined}>
                        {post.quizFields.skill[0] === "reading" && (
                          <Splitter.Panel min="40%" max="60%">
                            <div className="prose-sm max-w-none p-[16px] pt-[30px] bg-white h-full overflow-y-auto text-[#000]">
                              {headingQuestion ? (
                                <PassageRenderer
                                  passageContent={currentPassage.passage_content}
                                />
                              ) : (
                                <TextSelectionWrapper>
                                  {parse(currentPassage.passage_content)}
                                </TextSelectionWrapper>
                              )}
                            </div>
                          </Splitter.Panel>
                        )}

                        {post.quizFields.skill[0] === "listening" && (
                          <Splitter.Panel className="hidden"></Splitter.Panel>
                        )}

                        <Splitter.Panel
                          className={
                            post.quizFields.skill[0] === "listening"
                              ? "basis-100"
                              : ""
                          }
                        >
                          <div
                            ref={questionPanelRef}
                            className={twMerge(
                              "p-6 space-y-6 h-full overflow-y-auto",
                              post.quizFields.skill[0] === "listening" &&
                                "mx-auto bg-white listening-board"
                            )}
                          >
                            {(currentPassage?.questions || []).map(
                              (question, index) => {
                                const isHeadingQ =
                                  String(question.matchingQuestion?.layoutType)
                                    .trim()
                                    .toLowerCase() === "heading";
                                const QuestionComponent = (
                                  <QuestionRender
                                    question={question}
                                    // @ts-ignore
                                    startIndex={question.startIndex}
                                  />
                                );
                                return isHeadingQ ? (
                                  <div key={index}> {QuestionComponent} </div>
                                ) : (
                                  <fieldset key={index} disabled={isFormDisabled}>
                                    {" "}
                                    {QuestionComponent}{" "}
                                  </fieldset>
                                );
                              }
                            )}
                          </div>
                        </Splitter.Panel>
                      </Splitter>
                    </div>
                    <div
                      className={twMerge(
                        "w-0 overflow-hidden duration-300",
                        isNotesViewOpen && "w-2/12"
                      )}
                    >
                      <Notepad />
                    </div>
                  </div>

                  <DragOverlay>
                    {activeId ? (
                      <DraggableOption
                        id={activeId}
                        // @ts-ignore
                        content={
                          answerOptions[parseInt(String(activeId).split("-")[2])]
                            ?.optionText || ""
                        }
                        isOverlay
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </ExamContext.Provider>
            </main>
          </TextSelectionProvider>
          
          {/* Footer is outside TextSelectionProvider so AudioPlayer won't unmount */}
          <Footer />
        </div>
      </form>
    </>
  );
}