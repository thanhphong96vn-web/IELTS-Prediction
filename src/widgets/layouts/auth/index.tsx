import { Footer } from "../base/ui";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <main className="pb-16 pt-8">{children}</main>
      <Footer />
    </>
  );
};
