import { Footer } from "../base/ui";
import { Header } from "./ui";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main className="pb-16 pt-8">{children}</main>
      <Footer />
    </>
  );
};
