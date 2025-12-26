export interface SampleEssayBannerConfig {
  writing: {
    title: {
      line1: string;
      line2: {
        highlighted: string;
        after: string;
      };
    };
    description: string[];
    button: {
      text: string;
      link: string;
    };
  };
  speaking: {
    title: {
      line1: string;
      line2: {
        highlighted: string;
        after: string;
      };
    };
    description: string[];
    button: {
      text: string;
      link: string;
    };
  };
}

