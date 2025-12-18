// Types cho admin config
export interface TestPlatformIntroConfig {
  badge: {
    text: string;
  };
  title: {
    line1: string;
    line2: string;
    line3: string;
    line4: string;
  };
  categories: Array<{
    name: string;
    href: string;
    icon: string;
  }>;
}

export interface HeroBannerConfig {
  trustpilot: {
    image: string;
    rating: string;
  };
  headline: {
    line1: string;
    line2: string;
    line3: string;
    line4: string;
  };
  description: {
    text: string;
    highlightText: string;
  };
  buttons: {
    primary: {
      text: string;
      link: string;
    };
    secondary: {
      text: string;
      link: string;
    };
  };
  bannerImage: string;
  featureCards: Array<{
    icon: string;
    title?: string;
    value?: string;
    subtitle: string;
    avatars?: string[];
  }>;
  decorativeShape: {
    image: string;
  };
}

export interface WhyChooseUsConfig {
  badge: {
    text: string;
  };
  title: string;
  description: string;
  statistics: Array<{
    icon: string;
    value: string;
    label: string;
  }>;
}

export interface FooterCtaBannerConfig {
  title: string;
  description: string;
  button: {
    text: string;
    link: string;
  };
}

export interface TestimonialsConfig {
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

export interface PracticeLibraryBannerConfig {
  listening: {
    title: string;
    description: string[];
    button: {
      text: string;
      link: string;
    };
  };
  reading: {
    title: string;
    description: string[];
    button: {
      text: string;
      link: string;
    };
  };
}

export interface ExamLibraryHeroConfig {
  title: string;
  breadcrumb: {
    homeLabel: string;
    currentLabel: string;
  };
}

// Re-export TopBarConfig từ header types
export type { TopBarConfig } from "@/widgets/layouts/base/ui/header/types";
