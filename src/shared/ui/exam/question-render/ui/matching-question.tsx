import { useFormContext, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import parse, { DOMNode, Element } from "html-react-parser"; // [SỬA] Import thêm DOMNode
import { Collapse } from "antd";
import { twMerge } from "tailwind-merge";
import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
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
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useExamContext } from "@/pages/take-the-test/context";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import React from "react"; // [SỬA] Import React

type AnswerFormValues = { answers: (string | number[] | object)[] };
type IQuestion =
  IPracticeSingle["quizFields"]["passages"][number]["questions"][number] & {
    question?: string;
    matchingQuestion?: {
      layoutType?: "standard" | "summary" | "heading" | string[]; // Có thể là mảng
      matchingItems?: { questionPart: string; correctAnswer: string }[];
      summaryText?: string;
      answerOptions?: { optionText: string }[];
    };
    startIndex?: number;
  };

// ==================================================================
// == COMPONENT CON (DÙNG CHUNG)
// ==================================================================

export const DraggableOption = ({
  id,
  content,
  isOverlay = false,
  isDropped = false,
  className = "",
}: {
  id: UniqueIdentifier;
  content: string;
  isOverlay?: boolean;
  isDropped?: boolean;
  className?: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={twMerge(
        "block rounded-sm bg-white touch-none select-none w-fit",
        "text-sm font-normal",
        isOverlay
          ? "cursor-grabbing border-2 border-blue-500 shadow-md px-3 py-0.5"
          : "cursor-grab",
        !isDropped && "border border-gray-400 px-3 py-0.5",
        isDragging && "opacity-30",
        className
      )}
    >
      <TextSelectionWrapper>{parse(content)}</TextSelectionWrapper>
    </div>
  );
};

export const StandardDroppableSlot = ({
  id,
  children,
  isOver,
  isSelected,
  onClick,
}: {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isOver: boolean;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const { setNodeRef } = useSortable({ id, disabled: true });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      tabIndex={0}
      className={twMerge(
        "droppable-slot-mq outline-none max-w-[520px] px-[10px] border border-dashed rounded-md flex items-center relative transition-colors min-h-[27px] text-[14px] text-[#000] cursor-pointer",
        isSelected || isOver ? "active-slot" : "border-[#c5c5c5]"
      )}
    >
      {children}
    </div>
  );
};

export const SummaryDroppableSlot = ({
  id,
  children,
  isOver,
  questionNumber,
  onClick,
  isSelected,
}: {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isOver: boolean;
  questionNumber: number;
  onClick: () => void;
  isSelected: boolean;
}) => {
  const { setNodeRef } = useSortable({ id, disabled: true });
  const hasChildren =
    children && Array.isArray(children) && children.length > 0;

  return (
    <span
      ref={setNodeRef}
      onClick={onClick}
      tabIndex={0}
      data-droppable-id={id}
      className={twMerge(
        "min-w-[96px] max-w-fit inline-block align-baseline max-h-[27px] px-2 py-0.5 leading-[20px]",
        "border border-dashed rounded-sm outline-none",
        "text-center relative transition-colors cursor-pointer",
        isSelected || isOver ? "active-slot" : "border-gray-400",
        isOver && !isSelected && "bg-blue-50"
      )}
    >
      {hasChildren ? (
        children
      ) : (
        <span className="font-bold text-[#000] select-none pointer-events-none">
          {questionNumber}
        </span>
      )}
    </span>
  );
};

export const HeadingDroppableSlot = ({
  id,
  children,
  isOver,
  questionNumber,
  onClick,
  isSelected,
}: {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isOver: boolean;
  questionNumber: number;
  onClick: () => void;
  isSelected: boolean;
}) => {
  const { setNodeRef } = useSortable({ id, disabled: true });
  const hasChildren =
    children && Array.isArray(children) && children.length > 0;

  return (
    <span
      ref={setNodeRef}
      onClick={onClick}
      tabIndex={0}
      data-droppable-id={id}
      className={twMerge(
        "inline-flex items-center justify-center",
        "w-full max-w-[550px] min-h-[27px] px-[10px] py-0.5 align-baseline",
        "border border-dashed rounded-md outline-none",
        "relative transition-colors cursor-pointer",
        isSelected || isOver ? "active-slot" : "border-gray-400",
        isOver && !isSelected && "bg-blue-50"
      )}
    >
      {hasChildren ? (
        children
      ) : (
        <span className="font-bold text-[#000] select-none pointer-events-none">
          {questionNumber}
        </span>
      )}
    </span>
  );
};

// ==================================================================
// == COMPONENT CHÍNH
// ==================================================================
export function MatchingQuestion({
  question,
  startIndex = 0,
  readOnly = false,
}: {
  question: IQuestion;
  startIndex?: number;
  readOnly?: boolean;
}) {
  const matchingData = question.matchingQuestion;
  if (!matchingData || !matchingData.layoutType) {
    return null;
  }

  const methods = useFormContext<AnswerFormValues>();
  const { activeQuestionIndex, setActiveQuestionIndex } = useExamContext();
  const { answerOptions = [] } = matchingData;

  const allOptionIds = useMemo(
    () => answerOptions.map((_, i) => `option-${startIndex}-${i}`),
    [answerOptions, startIndex]
  );

  // FIX: Xử lý `layoutType` có thể là mảng hoặc string
  const layoutValue = matchingData.layoutType;
  const layout = Array.isArray(layoutValue)
    ? layoutValue[0]
    : String(layoutValue || "")
        .trim()
        .toLowerCase();

  const findContainer = (
    items: Record<string, UniqueIdentifier[]>,
    id: UniqueIdentifier
  ) => {
    if (!id) return undefined;
    if (id in items) return id as string;
    return Object.keys(items).find((key) => items[key].includes(id));
  };

  // ================== LAYOUT: 'summary' ==================
  if (layout === "summary") {
    const { processedText, correctAnswers, totalGaps } = useMemo(() => {
      const answers: string[] = [];
      const summaryText = matchingData.summaryText || "";
      let gapCount = 0;
      const textToRender = summaryText.replace(
        /\{(.*?)\}/g,
        (match, answer) => {
          answers.push(answer.trim());
          const currentGapIndex = gapCount;
          gapCount++;
          return `<span data-gap-index="${currentGapIndex}"></span>`;
        }
      );
      return {
        processedText: textToRender,
        correctAnswers: answers,
        totalGaps: gapCount,
      };
    }, [matchingData.summaryText]);

    if (
      !matchingData.summaryText ||
      answerOptions.length === 0 ||
      totalGaps === 0
    ) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Dữ liệu Matching (Summary) không hợp lệ.
        </div>
      );
    }

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor)
    );
    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id);
      setOverId(null);
    };
    const handleDragOver = (event: DragOverEvent) => {
      setOverId(event.over?.id ?? null);
    };

    return (
      <div className="space-y-6" id={`#question-no-${startIndex + 1}`}>
        <div className="heading-group">
          <h3 className="text-[16px] font-bold">
            Questions {startIndex + 1} - {startIndex + totalGaps}
          </h3>
          <div className="text-[16px] leading-[2] prose prose-sm max-w-none text-[#000]">
            {parse(
              question.instructions ||
                "Complete the summary using the list of words. Choose the correct answer and move it into the gap."
            )}
          </div>
        </div>

        <Controller
          control={methods.control}
          name={`answers.${startIndex}`}
          defaultValue={{}}
          render={({ field }) => {
            // --- [LOGIC MỚI CHO READONLY SUMMARY] ---
            if (readOnly) {
              // === CHẾ ĐỘ READONLY ===
              const userAnswers =
                typeof field.value === "object" && field.value !== null
                  ? (field.value as { [key: number]: string })
                  : {};

              const readOnlyParserOptions = {
                replace: (domNode: DOMNode) => {
                  const element = domNode as Element;
                  if (
                    element.name === "span" &&
                    element.attribs &&
                    element.attribs["data-gap-index"] !== undefined
                  ) {
                    const gapIndex = parseInt(
                      element.attribs["data-gap-index"],
                      10
                    );
                    if (isNaN(gapIndex)) return;

                    // 1. Lấy text câu trả lời
                    const userAnswerOptionId = userAnswers[gapIndex];
                    const userAnswerOptionIndex = userAnswerOptionId
                      ? parseInt(String(userAnswerOptionId).split("-")[2])
                      : -1;
                    const userAnswerText =
                      userAnswerOptionIndex !== -1 &&
                      answerOptions[userAnswerOptionIndex]
                        ? answerOptions[userAnswerOptionIndex].optionText
                        : undefined;
                    const correctAnswerText = correctAnswers[gapIndex];

                    // 2. Xác định trạng thái
                    const userDidAnswer = userAnswerText !== undefined;
                    const isCorrect =
                      userDidAnswer &&
                      userAnswerText.trim().toLowerCase() ===
                        correctAnswerText.trim().toLowerCase();

                    let content: React.ReactNode;
                    let boxClasses = "border-gray-400"; // Mặc định border xám

                    if (isCorrect) {
                      // 1. ĐÚNG: Text xanh
                      content = (
                        <span className="text-green-700 font-semibold">
                          {userAnswerText}
                        </span>
                      );
                      boxClasses = "border-green-500 bg-green-50"; // Nền xanh
                    } else if (userDidAnswer) {
                      // 2. SAI: Text đỏ (gạch) + xanh
                      content = (
                        <>
                          <span className="text-red-500 line-through mr-1">
                            {userAnswerText}
                          </span>
                          <span className="text-green-700 font-semibold">
                            {correctAnswerText}
                          </span>
                        </>
                      );
                      boxClasses = "border-red-500 bg-red-50"; // Nền đỏ
                    } else {
                      // 3. BỎ LỠ: Text xám
                      content = (
                        <span className="text-gray-500 font-semibold">
                          {correctAnswerText}
                        </span>
                      );
                      boxClasses = "border-gray-400 bg-gray-50"; // Nền xám
                    }

                    // 4. Trả về component với viền đứt VÀ MÀU NỀN
                    return (
                      <span
                        className={twMerge(
                          "inline-block border border-dashed px-2 py-0.5 align-baseline min-w-[80px] text-center rounded-sm", // Style cơ bản
                          boxClasses // Áp dụng màu nền/viền
                        )}
                      >
                        {content}
                      </span>
                    );
                  }
                },
              };

              return (
                <>
                  {/* 1. Hiển thị danh sách Options */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {answerOptions.map((option, index) => (
                      <div
                        key={index}
                        className="border rounded-md px-3 py-0.5 bg-gray-50 text-gray-700 text-sm"
                      >
                        <TextSelectionWrapper>
                          {parse(option.optionText)}
                        </TextSelectionWrapper>
                      </div>
                    ))}
                  </div>

                  {/* 2. Hiển thị đoạn văn với kết quả inline */}
                  <div className="prose-base text-black leading-relaxed">
                    <TextSelectionWrapper>
                      {parse(processedText, readOnlyParserOptions)}
                    </TextSelectionWrapper>
                  </div>

                  {/* 3. Hiển thị Explanation */}
                  {question.explanations?.[0]?.content && (
                    <div className="mt-6">
                      <Collapse
                        size="small"
                        items={[
                          {
                            key: `exp-summary-general-${startIndex}`,
                            label: "Explanation",
                            children: (
                              <div className="prose prose-sm max-w-none p-2 rounded">
                                {" "}
                                <TextSelectionWrapper>
                                  {" "}
                                  {parse(question.explanations[0].content)}{" "}
                                </TextSelectionWrapper>{" "}
                              </div>
                            ),
                          },
                        ]}
                      />
                    </div>
                  )}
                </>
              );
            }
            // === HẾT CHẾ ĐỘ READONLY ===

            // === CHẾ ĐỘ LÀM BÀI (Tương tác - Giữ nguyên) ===
            const [items, setItems] = useState<
              Record<string, UniqueIdentifier[]>
            >({});
            useEffect(() => {
              /* ... init items ... */
              const formAnswers =
                typeof field.value === "object" && field.value !== null
                  ? (field.value as any)
                  : {};
              const newItems: Record<string, UniqueIdentifier[]> = {
                available: [],
              };
              for (let i = 0; i < totalGaps; i++) {
                newItems[`gap-${i}`] = [];
              }
              answerOptions.forEach((_, optionIndex) => {
                const optionId = `option-${startIndex}-${optionIndex}`;
                let isDroppedIntoGap = false;
                for (const gapKey in formAnswers) {
                  if (formAnswers[gapKey] === optionId) {
                    if (newItems[`gap-${gapKey}`]) {
                      newItems[`gap-${gapKey}`].push(optionId);
                      isDroppedIntoGap = true;
                    }
                    break;
                  }
                }
                if (!isDroppedIntoGap) {
                  newItems["available"].push(optionId);
                }
              });
              setItems(newItems);
            }, [field.value, totalGaps, answerOptions, startIndex]);

            const handleDragEnd = (event: DragEndEvent) => {
              /* ... handle drag end ... */
              setActiveId(null);
              setOverId(null);
              const { active, over } = event;
              const activeContainer = findContainer(items, active.id);
              let overContainerId: string | undefined;
              if (over) {
                overContainerId =
                  over.id in items
                    ? (over.id as string)
                    : findContainer(items, over.id);
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
                if (newItems[overContainerId]) {
                  newItems[overContainerId] = [active.id];
                } else {
                  if (!newItems["available"]) newItems["available"] = [];
                  if (!newItems["available"].includes(active.id))
                    newItems["available"].push(active.id);
                }
              } else {
                if (!newItems["available"]) newItems["available"] = [];
                if (!newItems["available"].includes(active.id)) {
                  newItems["available"].push(active.id);
                }
              }
              setItems(newItems);
              const currentFormAnswers =
                typeof field.value === "object" && field.value !== null
                  ? { ...(field.value as any) }
                  : {};
              let updatedFormAnswers = { ...currentFormAnswers };
              Object.keys(updatedFormAnswers).forEach((key) => {
                if (updatedFormAnswers[key] === active.id) {
                  delete updatedFormAnswers[key];
                }
              });
              if (String(overContainerId).startsWith("gap-")) {
                const gapIndex = String(overContainerId).split("-")[1];
                if (
                  gapIndex &&
                  !isNaN(parseInt(gapIndex, 10)) &&
                  parseInt(gapIndex, 10) < totalGaps
                ) {
                  updatedFormAnswers[gapIndex] = active.id;
                  const absoluteIndex = startIndex + parseInt(gapIndex, 10);
                  if (!isNaN(absoluteIndex))
                    setActiveQuestionIndex(absoluteIndex);
                }
              }
              field.onChange(updatedFormAnswers);
            };

            const parserOptions = {
              replace: (domNode: DOMNode) => {
                const element = domNode as Element;
                if (
                  element.name === "span" &&
                  element.attribs &&
                  element.attribs["data-gap-index"] !== undefined
                ) {
                  const gapIndex = parseInt(
                    element.attribs["data-gap-index"],
                    10
                  );
                  if (isNaN(gapIndex)) return;
                  const containerId = `gap-${gapIndex}`;
                  const questionNumber = startIndex + gapIndex + 1;
                  const questionAbsoluteIndex = startIndex + gapIndex;
                  return (
                    <SortableContext
                      items={items[containerId] || []}
                      id={containerId}
                    >
                      <SummaryDroppableSlot
                        id={containerId}
                        isOver={overId === containerId}
                        questionNumber={questionNumber}
                        onClick={() =>
                          setActiveQuestionIndex(questionAbsoluteIndex)
                        }
                        isSelected={
                          activeQuestionIndex === questionAbsoluteIndex
                        }
                      >
                        {(items[containerId] || []).map((optionId) => {
                          const optionIndex = parseInt(
                            String(optionId).split("-")[2]
                          );
                          if (
                            isNaN(optionIndex) ||
                            optionIndex < 0 ||
                            optionIndex >= answerOptions.length
                          )
                            return null;
                          return (
                            <DraggableOption
                              key={optionId}
                              id={optionId}
                              content={answerOptions[optionIndex].optionText}
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
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="prose-base text-black leading-relaxed">
                  <TextSelectionWrapper>
                    {parse(processedText, parserOptions)}
                  </TextSelectionWrapper>
                </div>
                {!readOnly && (
                  <div className="mt-[60px] border-gray-200">
                    {/* [SỬA] Dùng allOptionIds ổn định */}
                    <SortableContext items={allOptionIds} id="available">
                      {/* [SỬA] Giữ nguyên style "flex-wrap" của summary */}
                      <div className="flex flex-wrap gap-3">
                        {/* [SỬA] Lặp qua allOptionIds */}
                        {allOptionIds.map((id, optionIndex) => {
                          const optionText =
                            answerOptions[optionIndex]?.optionText;
                          if (!optionText) return null;

                          // [SỬA] Kiểm tra tính khả dụng
                          const isAvailable = (
                            items["available"] || []
                          ).includes(id);

                          if (isAvailable) {
                            // [SỬA] Render DraggableOption nếu có
                            return (
                              <DraggableOption
                                key={id}
                                id={id}
                                content={optionText}
                                isDropped={false}
                              />
                            );
                          } else {
                            // [SỬA] Render Placeholder nếu không (style copy từ layout 'standard')
                            return (
                              <div
                                key={`placeholder-${id}`}
                                className="block rounded-sm bg-white px-3 py-0.5 w-fit"
                              >
                                <div className="invisible text-sm font-normal">
                                  <TextSelectionWrapper>
                                    {parse(optionText)}
                                  </TextSelectionWrapper>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </SortableContext>
                  </div>
                )}
                <DragOverlay>
                  {activeId ? (
                    <DraggableOption
                      id={activeId}
                      content={
                        answerOptions[parseInt(String(activeId).split("-")[2])]
                          ?.optionText || ""
                      }
                      isOverlay
                      isDropped={false}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            );
          }}
        />
      </div>
    );

    // ================== LAYOUT: 'heading' ==================
  } else if (layout === "heading") {
    // ... (Code 'heading' không thay đổi) ...
    const { items } = useExamContext();
    if (!items && !readOnly) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Lỗi: Context chưa cung cấp `items`.
        </div>
      );
    }
    if (answerOptions.length === 0) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Lỗi: Thiếu "Answer Options".
        </div>
      );
    }

    return (
      <div className="space-y-6" id={`#question-no-${startIndex + 1}`}>
        <div className="heading-group">
          <h3 className="text-[16px] font-bold">
            {question.title || "Questions"}
          </h3>
          <div className="text-[16px] leading-[2] prose prose-sm max-w-none text-[#000]">
            {parse(
              question.instructions ||
                "Choose the correct heading for each section."
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="pt-3">
            {/* Sử dụng `allOptionIds` ổn định cho SortableContext
             */}
            <SortableContext items={allOptionIds} id="available">
              <div className="space-y-2">
                {/* Lặp qua `allOptionIds` ổn định
                 */}
                {allOptionIds.map((id, optionIndex) => {
                  const optionText = answerOptions[optionIndex]?.optionText;
                  if (!optionText) return null; // An toàn

                  // Kiểm tra xem ID này có "available" không
                  const isAvailable = (items["available"] || []).includes(id);

                  if (isAvailable) {
                    // CÓ: Render DraggableOption
                    return (
                      <DraggableOption
                        key={id}
                        id={id}
                        content={optionText}
                        isDropped={false}
                      />
                    );
                  } else {
                    // KHÔNG: Render Placeholder
                    return (
                      <div
                        key={`placeholder-${id}`}
                        // Style giống hệt DraggableOption
                        className="block rounded-sm  px-3 py-0.5 w-fit"
                      >
                        {/* Nội dung tàng hình để giữ chiều cao */}
                        <div className="invisible text-sm font-normal">
                          <TextSelectionWrapper>
                            {parse(optionText)}
                          </TextSelectionWrapper>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </SortableContext>
          </div>
        )}
        {readOnly && (
          <div className="mt-6 space-y-4">
            <div className="pt-3 heading-list">
              <h4 className="text-[16px] font-bold mb-4">List of Headings</h4>
              <div className="space-y-2 prose prose-sm max-w-none">
                {answerOptions.map((option, index) => (
                  <div
                    key={`heading-opt-${index}`}
                    className="block rounded-sm border border-gray-300 px-3 py-0 font-bold text-[17px] text-[#888]"
                  >
                    <TextSelectionWrapper>
                      {parse(option.optionText)}
                    </TextSelectionWrapper>
                  </div>
                ))}
              </div>
            </div>
            {question.explanations?.[0]?.content && (
              <div className="mt-2">
                <Collapse
                  size="small"
                  items={[
                    {
                      key: `exp-heading-general-${startIndex}`,
                      label: "Explanation",
                      children: (
                        <div className="prose prose-sm max-w-none p-2 rounded">
                          {" "}
                          <TextSelectionWrapper>
                            {" "}
                            {parse(question.explanations[0].content)}{" "}
                          </TextSelectionWrapper>{" "}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );

    // ================== LAYOUT: 'standard' ==================
  } else {
    const itemsToMatch = matchingData.matchingItems || [];
    if (
      !itemsToMatch ||
      itemsToMatch.length === 0 ||
      !answerOptions ||
      answerOptions.length === 0
    ) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Dữ liệu Matching (Standard) không hợp lệ.
        </div>
      );
    }
    const standardQuestionCount = itemsToMatch.length;
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor)
    );
    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id);
      setOverId(null);
    };
    const handleDragOver = (event: DragOverEvent) => {
      setOverId(event.over?.id ?? null);
    };

    return (
      <div className="space-y-6" id={`#question-no-${startIndex + 1}`}>
        <div className="heading-group">
          <h3 className="text-[16px] font-bold ">
            {question.title ||
              `Questions ${startIndex + 1} - ${
                startIndex + standardQuestionCount
              }`}
          </h3>
          <div className="text-[16px] leading-[2] prose prose-sm max-w-none text-[#000]">
            {parse(
              question.instructions ||
                "Complete each sentence with the correct ending. Choose the correct answer and move it into the gap."
            )}
          </div>
        </div>
        <Controller
          control={methods.control}
          name={`answers.${startIndex}`}
          defaultValue={{}}
          render={({ field }) => {
            const [items, setItems] = useState<
              Record<string, UniqueIdentifier[]>
            >({});
            useEffect(() => {
              /* ... init items ... */
              const matchedAnswers: { [key: number]: number } =
                typeof field.value === "object" && field.value !== null
                  ? (field.value as any)
                  : {};
              const newItems: Record<string, UniqueIdentifier[]> = {
                available: [],
              };
              itemsToMatch.forEach((_, index) => {
                newItems[`item-${index}`] = [];
              });
              const allOptionIds = answerOptions.map(
                (_, i) => `option-${startIndex}-${i}`
              );
              allOptionIds.forEach((id) => {
                const optionIndex = parseInt(id.split("-")[2]);
                const containerIndexStr = Object.keys(matchedAnswers).find(
                  (key) => matchedAnswers[parseInt(key)] === optionIndex
                );
                if (containerIndexStr !== undefined) {
                  const containerIndex = parseInt(containerIndexStr, 10);
                  if (
                    !isNaN(containerIndex) &&
                    newItems[`item-${containerIndex}`]
                  ) {
                    newItems[`item-${containerIndex}`] = [id];
                  } else {
                    newItems["available"].push(id);
                  }
                } else {
                  newItems["available"].push(id);
                }
              });
              setItems(newItems);
            }, [field.value, itemsToMatch, answerOptions, startIndex]);

            const handleDragEnd = (event: DragEndEvent) => {
              /* ... handle drag end ... */
              setActiveId(null);
              setOverId(null);
              const { active, over } = event;
              if (!over) return;
              const activeContainer = findContainer(items, active.id);
              const overContainerId =
                over.id in items
                  ? (over.id as string)
                  : findContainer(items, over.id);
              if (
                !activeContainer ||
                !overContainerId ||
                activeContainer === overContainerId
              )
                return;
              const newAnswers =
                typeof field.value === "object" && field.value !== null
                  ? { ...(field.value as { [key: number]: number }) }
                  : {};
              const activeOptionIndex = parseInt(
                active.id.toString().split("-")[2]
              );
              Object.keys(newAnswers).forEach((keyStr) => {
                if (newAnswers[parseInt(keyStr)] === activeOptionIndex)
                  delete newAnswers[parseInt(keyStr)];
              });
              if (String(overContainerId).startsWith("item-")) {
                const targetSlot = parseInt(
                  String(overContainerId).split("-")[1]
                );
                if (!isNaN(targetSlot) && targetSlot < standardQuestionCount) {
                  if (
                    items[overContainerId] &&
                    items[overContainerId].length > 0
                  ) {
                    const oldItemId = items[overContainerId][0];
                    const oldOptionIndex = parseInt(
                      oldItemId.toString().split("-")[2]
                    );
                    Object.keys(newAnswers).forEach((keyStr) => {
                      if (newAnswers[parseInt(keyStr)] === oldOptionIndex)
                        delete newAnswers[parseInt(keyStr)];
                    });
                  }
                  newAnswers[targetSlot] = activeOptionIndex;
                  const absoluteIndex = startIndex + targetSlot;
                  if (!isNaN(absoluteIndex))
                    setActiveQuestionIndex(absoluteIndex);
                }
              }
              field.onChange(newAnswers);
            };

            // === [LOGIC MỚI] ===
            if (readOnly) {
              // === CHẾ ĐỘ READONLY ===
              return (
                <div className="space-y-6">
                  {/* 1. List of questions with inline results */}
                  <div className="space-y-4">
                    {itemsToMatch.map((item, itemIndex) => {
                      const questionAbsoluteIndex = startIndex + itemIndex;

                      // Lấy câu trả lời
                      const userAnswers =
                        typeof field.value === "object" && field.value !== null
                          ? (field.value as { [key: number]: number })
                          : {};
                      const userAnswerOptionIndex = userAnswers
                        ? userAnswers[itemIndex]
                        : undefined;
                      const userAnswerText =
                        userAnswerOptionIndex !== undefined
                          ? answerOptions[userAnswerOptionIndex]?.optionText
                          : undefined;
                      const correctAnswerText = item.correctAnswer;

                      // Xác định trạng thái
                      const userDidAnswer = userAnswerText !== undefined;
                      const isCorrect =
                        userDidAnswer &&
                        userAnswerText.trim().toLowerCase() ===
                          correctAnswerText.trim().toLowerCase();

                      return (
                        <div
                          key={`result-standard-${itemIndex}`}
                          className="space-y-2"
                          id={`#question-no-${questionAbsoluteIndex + 1}`}
                        >
                          {/* Question Text */}
                          <div className="text-[16px] mb-[2px]">
                            <TextSelectionWrapper>
                              {parse(item.questionPart)}
                            </TextSelectionWrapper>
                          </div>

                          {/* Result Slot */}
                          <div
                            className={twMerge(
                              "droppable-slot-mq outline-none max-w-[520px] px-[10px] border border-dashed rounded-md flex items-center relative transition-colors min-h-[27px] text-[14px] text-[#000]",
                              // Áp dụng màu sắc dựa trên trạng thái
                              isCorrect
                                ? "border-green-500 bg-green-50"
                                : !userDidAnswer
                                ? "border-gray-400 bg-gray-50"
                                : "border-red-500 bg-red-50"
                            )}
                          >
                            {isCorrect && (
                              <span className="text-green-700 font-semibold">
                                {userAnswerText}
                              </span>
                            )}
                            {!isCorrect && userDidAnswer && (
                              <span className="flex-grow">
                                <span className="text-red-500 line-through mr-2">
                                  {userAnswerText}
                                </span>
                                <span className="text-green-700 font-semibold">
                                  {correctAnswerText}
                                </span>
                              </span>
                            )}
                            {!userDidAnswer && (
                              <span className="text-gray-500 font-semibold">
                                {correctAnswerText}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. List of Answer Options (readOnly) */}
                  <div className="pt-3">
                    <h4 className="text-[16px] font-bold mb-4">
                      Answer Options
                    </h4>
                    <div className="space-y-2 prose prose-sm max-w-none">
                      {answerOptions.map((option, index) => (
                        <div
                          key={`sa-opt-${index}`}
                          className="block rounded-sm border border-gray-300 px-3 py-0.5 bg-gray-50 text-gray-700"
                        >
                          <TextSelectionWrapper>
                            {parse(option.optionText)}
                          </TextSelectionWrapper>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Explanation */}
                  {question.explanations?.[0]?.content && (
                    <div className="mt-2">
                      <Collapse
                        size="small"
                        items={[
                          {
                            key: `exp-standard-general-${startIndex}`,
                            label: "Explanation",
                            children: (
                              <div className="prose prose-sm max-w-none p-2 rounded">
                                {" "}
                                <TextSelectionWrapper>
                                  {" "}
                                  {parse(question.explanations[0].content)}{" "}
                                </TextSelectionWrapper>{" "}
                              </div>
                            ),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              );
            }
            // === HẾT CHẾ ĐỘ READONLY ===

            // === CHẾ ĐỘ LÀM BÀI (Tương tác) ===
            return (
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="flex flex-col gap-5">
                  {/* Đây là phần render các câu hỏi (slot) - GIỮ NGUYÊN */}
                  <div className="space-y-4">
                    {itemsToMatch.map((item, itemIndex) => {
                      const containerId = `item-${itemIndex}`;
                      const questionAbsoluteIndex = startIndex + itemIndex;
                      return (
                        <div
                          key={containerId}
                          className="space-y-2"
                          id={`#question-no-${questionAbsoluteIndex + 1}`}
                        >
                          <div className="text-[16px] mb-[2px]">
                            <TextSelectionWrapper>
                              {parse(item.questionPart)}
                            </TextSelectionWrapper>
                          </div>
                          <SortableContext
                            items={items[containerId] || []}
                            id={containerId}
                          >
                            <StandardDroppableSlot
                              id={containerId}
                              isOver={
                                overId === containerId ||
                                (overId
                                  ? findContainer(items, overId) === containerId
                                  : false)
                              }
                              isSelected={
                                activeQuestionIndex === questionAbsoluteIndex
                              }
                              onClick={() =>
                                setActiveQuestionIndex(questionAbsoluteIndex)
                              }
                            >
                              {(items[containerId] || []).map((id) => {
                                const optionIndex = parseInt(
                                  id.toString().split("-")[2]
                                );
                                if (
                                  isNaN(optionIndex) ||
                                  optionIndex < 0 ||
                                  optionIndex >= answerOptions.length
                                )
                                  return null;
                                return (
                                  <DraggableOption
                                    key={id}
                                    id={id}
                                    content={
                                      answerOptions[optionIndex].optionText
                                    }
                                    isDropped
                                  />
                                );
                              })}
                              {(!items[containerId] ||
                                items[containerId].length === 0) && (
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[16px] text-[#000] pointer-events-none">
                                  {questionAbsoluteIndex + 1}
                                </span>
                              )}
                            </StandardDroppableSlot>
                          </SortableContext>
                        </div>
                      );
                    })}
                  </div>

                  {/* Đây là phần render các lựa chọn (options) - CODE MÀ BẠN ĐÃ SỬA */}
                  {!readOnly && (
                    <div className="pt-3">
                      <SortableContext items={allOptionIds} id="available">
                        <div className="space-y-2">
                          {allOptionIds.map((id, optionIndex) => {
                            const optionText =
                              answerOptions[optionIndex]?.optionText;
                            if (!optionText) return null;

                            const isAvailable = (
                              items["available"] || []
                            ).includes(id);

                            if (isAvailable) {
                              return (
                                <DraggableOption
                                  key={id}
                                  id={id}
                                  content={optionText}
                                  isDropped={false}
                                />
                              );
                            } else {
                              return (
                                <div
                                  key={`placeholder-${id}`}
                                  className="block rounded-sm bg-white px-3 py-0.5 w-fit"
                                >
                                  <div className="invisible text-sm font-normal">
                                    <TextSelectionWrapper>
                                      {parse(optionText)}
                                    </TextSelectionWrapper>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </SortableContext>
                    </div>
                  )}
                </div>{" "}
                {/* <--- Thẻ đóng cho "flex flex-col gap-5" */}
                {/* Phần DragOverlay - GIỮ NGUYÊN */}
                <DragOverlay>
                  {activeId ? (
                    <DraggableOption
                      id={activeId}
                      content={
                        answerOptions[parseInt(String(activeId).split("-")[2])]
                          ?.optionText || ""
                      }
                      isOverlay
                      isDropped={false}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext> /* <--- Thẻ đóng cho DndContext */
            );
          }}
        />
      </div>
    );
  }
}
