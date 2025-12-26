import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps } from "next";
import type { FAQConfig } from "@/shared/types/admin-config";

export { PageSubscription } from "./ui";

interface TestimonialsConfig {
  title: string;
  description: string;
  button: {
    text: string;
    link: string;
  };
  testimonials: Array<{
    name: string;
    title: string;
    company: string;
    quote: string;
    avatar: string;
  }>;
}

// Wrapper function để đọc testimonials config
const withTestimonialsConfig = async (
  context: Parameters<GetServerSideProps>[0]
) => {
  let testimonialsConfig: TestimonialsConfig;

  try {
    // Gọi API route nội bộ để đọc config
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/admin/home/testimonials-config`, {
      headers: {
        cookie: context.req.headers.cookie || "",
      },
    });

    if (res.ok) {
      testimonialsConfig = await res.json();
    } else {
      throw new Error("Failed to fetch config");
    }
  } catch {
    // Nếu API route fail, dùng config mặc định
    testimonialsConfig = {
      title: "What Our Learners Say",
      description:
        "Learning communicate to global world and build a bright future with our histudy.",
      button: {
        text: "Marquee Y",
        link: "#",
      },
      testimonials: [
        {
          name: "Martha Maldonado",
          title: "Executive Chairman",
          company: "@ Google",
          quote:
            "After the launch, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/art-stu-1.png",
        },
        {
          name: "Michael D. Lovelady",
          title: "CEO",
          company: "@ Google",
          quote:
            "Histudy education, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/art-stu-2.png",
        },
        {
          name: "Valerie J. Creasman",
          title: "Executive Designer",
          company: "@ Google",
          quote:
            "Our educational, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/art-stu-3.png",
        },
        {
          name: "Hannah R. Sutton",
          title: "Executive Chairman",
          company: "@ Facebook",
          quote:
            "People says about, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/i-team.png",
        },
        {
          name: "Pearl B. Hill",
          title: "Chairman SR",
          company: "@ Facebook",
          quote:
            "Like this histudy, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/art-stu-1.png",
        },
        {
          name: "Mandy F. Wood",
          title: "SR Designer",
          company: "@ Google",
          quote:
            "Educational template, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/art-stu-2.png",
        },
        {
          name: "Mildred W. Diaz",
          title: "Executive Officer",
          company: "@ Yelp",
          quote:
            "Online leaning, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/art-stu-3.png",
        },
        {
          name: "Christopher H. Win",
          title: "Product Designer",
          company: "@ Google",
          quote:
            "Remote learning, vulputate at sapien sit amet, auctor iaculis lorem. In vel hend rerit nisi. Vestibulum eget risus velit.",
          avatar: "/img-admin/i-team.png",
        },
      ],
    };
  }

  return {
    props: {
      testimonialsConfig,
    },
  };
};

// Wrapper function để đọc FAQ config
const withFAQConfig = async (
  context: Parameters<GetServerSideProps>[0]
) => {
  let faqConfig: FAQConfig;

  try {
    // Gọi API route nội bộ để đọc config
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/admin/subscription/faq-config`, {
      headers: {
        cookie: context.req.headers.cookie || "",
      },
    });

    if (res.ok) {
      faqConfig = await res.json();
    } else {
      throw new Error("Failed to fetch config");
    }
  } catch {
    // Nếu API route fail, dùng config mặc định
    faqConfig = {
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
    };
  }

  return {
    props: {
      faqConfig,
    },
  };
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  withTestimonialsConfig,
  withFAQConfig
);

