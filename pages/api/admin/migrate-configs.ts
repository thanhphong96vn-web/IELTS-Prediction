/**
 * API endpoint để migrate configs từ filesystem sang KV
 * Chỉ chạy trên Vercel production
 * 
 * Usage: POST /api/admin/migrate-configs
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { readConfigFromFileSystem, writeConfig } from "../../../lib/server/admin-config-helper";

const configs = [
  'hero-banner',
  'test-platform-intro',
  'why-choose-us',
  'testimonials',
  'header/top-bar',
  'footer/cta-banner',
  'subscription/course-packages',
  'subscription/faq',
  'privacy-policy',
  'terms-of-use',
  'sample-essay/banner',
  'ielts-practice-library/banner',
  'ielts-exam-library/hero-banner',
];

const defaultConfigs: Record<string, any> = {
  'subscription/faq': {
    badge: {
      text: "FREQUENTLY ASKED QUESTIONS",
    },
    title: "Have a Question with Histudy University?",
    description:
      "Its an educational platform Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    items: [
      {
        question: "What is Histudy ? How does it work?",
        answer:
          "Histudy is an educational platform designed to help students learn and grow. It works by providing comprehensive learning materials, interactive courses, and personalized learning paths to help you achieve your educational goals.",
      },
      {
        question: "How can I get the customer support?",
        answer:
          "You can reach our customer support team through multiple channels including email, live chat, or phone. Our support team is available 24/7 to assist you with any questions or concerns you may have.",
      },
      {
        question:
          "Can I get update regularly and For how long do I get updates?",
        answer:
          "Yes, you will receive regular updates about new courses, features, and educational content. Updates are provided for the duration of your subscription period, ensuring you always have access to the latest materials and improvements.",
      },
      {
        question: "15 Things To Know About Education?",
        answer:
          "Education is a lifelong journey that involves continuous learning, critical thinking, and personal growth. It encompasses various forms of learning including formal education, self-study, and practical experience. Understanding key educational principles can help you make the most of your learning experience.",
      },
    ],
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Chỉ chạy trên Vercel production
  if (process.env.VERCEL !== "1") {
    return res.status(403).json({ 
      message: "Migration chỉ có thể chạy trên Vercel production" 
    });
  }

  // Kiểm tra KV credentials
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({
      message: "KV_REST_API_URL hoặc KV_REST_API_TOKEN không được set",
    });
  }

  console.log("🚀 Starting migration to Vercel KV...");

  const results: Array<{ config: string; status: "success" | "failed"; error?: string }> = [];

  for (const configName of configs) {
    try {
      let config;
      
      // Thử đọc từ filesystem
      try {
        config = readConfigFromFileSystem(configName);
      } catch (fsError) {
        // Nếu file không tồn tại, dùng default config nếu có
        if (defaultConfigs[configName]) {
          console.log(`⚠ File not found for ${configName}, using default config`);
          config = defaultConfigs[configName];
        } else {
          throw fsError;
        }
      }
      
      // Ghi vào KV
      await Promise.resolve(writeConfig(configName, config));
      results.push({ config: configName, status: "success" });
      console.log(`✓ Migrated: ${configName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ config: configName, status: "failed", error: errorMessage });
      console.error(`✗ Failed to migrate ${configName}:`, errorMessage);
    }
  }

  const successCount = results.filter(r => r.status === "success").length;
  const failCount = results.filter(r => r.status === "failed").length;

  return res.status(200).json({
    message: "Migration completed",
    success: successCount,
    failed: failCount,
    results,
  });
}

