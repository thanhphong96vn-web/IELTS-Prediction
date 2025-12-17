import { Container } from "@/shared/ui";
import Image from "next/image";

const TESTIMONIALS = [
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
];

const StarRating = () => {
  return (
    <div className="flex gap-1 mt-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="material-symbols-rounded text-yellow-500 filled text-lg"
        >
          star
        </span>
      ))}
    </div>
  );
};

const TestimonialCard = ({
  name,
  title,
  company,
  quote,
  avatar,
}: (typeof TESTIMONIALS)[0]) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 min-w-[320px] max-w-[320px] h-full">
      <div className="relative">
        {/* Quote Icon */}
        <div className="absolute -top-4 -right-2 opacity-30">
          <Image
            src="/img-admin/quote.svg"
            alt="quote"
            width={48}
            height={42}
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
            <Image
              src={avatar}
              alt={name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <h5 className="font-bold text-gray-900 text-sm">{name}</h5>
            <span className="text-xs text-gray-600">
              {title} <i>{company}</i>
            </span>
          </div>
        </div>

        {/* Quote */}
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{quote}</p>

        {/* Star Rating */}
        <StarRating />
      </div>
    </div>
  );
};

export const Testimonials = () => {
  // Duplicate testimonials for seamless loop
  // Create a copy before reversing to avoid mutating the original array
  const reversedTestimonials = [...TESTIMONIALS].reverse();
  const testimonialsRow1 = [...TESTIMONIALS, ...TESTIMONIALS];
  const testimonialsRow2 = [...reversedTestimonials, ...reversedTestimonials];

  return (
    <div className="bg-white py-16 md:py-20 overflow-hidden">
      <Container className="max-w-full px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side - Introduction */}
          <div className="lg:col-span-3 pl-0 lg:pl-24">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              What Our Learners Say
            </h2>
            <p className="text-base text-gray-600 mb-5">
              Learning communicate to global world and build a bright future
              with our histudy.
            </p>
            <button
              className="px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #8b5cf6 100%)",
              }}
            >
              <span className="flex items-center gap-2">
                Marquee Y
                <span className="material-symbols-rounded">arrow_forward</span>
              </span>
            </button>
          </div>

          {/* Right Side - Testimonials */}
          <div className="lg:col-span-9 overflow-hidden">
            {/* Row 1 - Scroll Right to Left */}
            <div className="overflow-hidden pt-12 pb-8">
              <div className="flex gap-5 animate-marquee-right-left">
                {testimonialsRow1.map((testimonial, index) => (
                  <TestimonialCard key={`row1-${index}`} {...testimonial} />
                ))}
              </div>
            </div>

            {/* Row 2 - Scroll Left to Right */}
            <div className="overflow-hidden pb-12">
              <div className="flex gap-5 animate-marquee-left-right">
                {testimonialsRow2.map((testimonial, index) => (
                  <TestimonialCard key={`row2-${index}`} {...testimonial} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes marquee-right-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes marquee-left-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-marquee-right-left {
          animation: marquee-right-left 40s linear infinite;
        }

        .animate-marquee-left-right {
          animation: marquee-left-right 40s linear infinite;
        }

        .animate-marquee-right-left:hover,
        .animate-marquee-left-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
