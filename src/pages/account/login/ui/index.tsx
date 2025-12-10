import { Button, Card, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { Container } from "@/shared/ui";
import { AuthLayout } from "@/widgets/layouts";
import { useRouter } from "next/router";
import { useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { GoogleIcon } from "@/shared/ui/icons";

type FormData = {
  email: string;
  password: string;
};

export function PageLogin() {
  const router = useRouter();
  const { signIn } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);

  const triggerGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (tokenResponse) => {
      const result = await signIn({
        provider: "GOOGLE",
        args: {
          code: tokenResponse.code,
        },
      });

      if (result) {
        const { redirect } = router.query;
        if (redirect) {
          router.push(redirect as string);
        } else {
          router.push("/");
        }
      }
    },
    onNonOAuthError: () => {
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: FormData) => {
    const result = await signIn({
      username: data.email,
      password: data.password,
    }).catch(() => {
      setError("email", {
        type: "manual",
        message:
          "You entered an invalid Email and/or Password combination. Please verify that you entered this information correctly.",
      });
    });

    if (result) {
      const { redirect } = router.query;
      if (redirect) {
        router.push(redirect as string);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="space-y-7">
      <div className="text-center">
        <h1 className="uppercase text-xl md:text-3xl font-bold text-primary-500">
          Log in to your account
        </h1>
      </div>
      <Container className="max-w-[400px]">
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor="email" className="block font-medium">
                Email
              </label>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: { value: true, message: "Email is required" },
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Please enter Email"
                    status={errors.email ? "error" : ""}
                  />
                )}
              />
              {errors.email && (
                <span className="text-red-500 block mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block font-medium">
                Password
              </label>
              <Controller
                control={control}
                name="password"
                rules={{ required: true }}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="Please enter password"
                    status={errors.password ? "error" : ""}
                  />
                )}
              />
              {errors.password && (
                <span className="text-red-500 block mt-1">
                  Password is required
                </span>
              )}
            </div>
            <Button
              htmlType="submit"
              type="primary"
              block
              size="large"
              loading={isSubmitting || isLoading}
            >
              Log in
            </Button>
          </form>
          <Link className="mt-4 block w-fit" href={ROUTES.FORGOT_PASSWORD}>
            Forgot Password?
          </Link>
          <Button
            onClick={() => {
              setIsLoading(true);
              triggerGoogleLogin();
            }}
            block
            size="large"
            className="mt-4"
            loading={isLoading || isSubmitting}
          >
            <GoogleIcon />
            Log in with Google
          </Button>
        </Card>
        <div className="mt-4">
          <p className="text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.REGISTER}
              className="text-primary-600 hover:underline"
            >
              Create one now!
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}

PageLogin.Layout = AuthLayout;
