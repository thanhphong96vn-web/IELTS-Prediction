import { Button, Card, DatePicker, Input, Select } from "antd";
import { Controller, useForm } from "react-hook-form";
import { AvatarUpload, Container } from "@/shared/ui";
import { AuthLayout } from "@/widgets/layouts";
import { useRouter } from "next/router";
import { useAppContext, useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import dayjs, { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "@/shared/ui/icons";

type FormData = {
  name: string;
  email: string;
  password: string;
  date_of_birth: Dayjs;
  gender: "male" | "female";
  avatar: File | null;
};

export function PageRegister() {
  const { masterData } = useAppContext();
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    const result = await signUp(data);

    if (!result.errors) {
      toast.success("Account created successfully");
      await signIn({ username: data.email, password: data.password });
      router.push("/");
    } else {
      setError("email", {
        type: "manual",
        message: result.errors[0].message,
      });
    }
  };

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

  return (
    <div className="space-y-7">
      <div className="text-center">
        <h1 className="uppercase text-xl md:text-3xl font-bold text-primary-500">
          Create an account
        </h1>
      </div>
      <Container className="max-w-[400px]">
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor="name" className="block font-medium">
                Full Name
              </label>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: { value: true, message: "Name is required" },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Please enter your name"
                    status={errors.name ? "error" : ""}
                  />
                )}
              />
              {errors.name && (
                <span className="text-red-500 block mt-1">
                  {errors.name.message}
                </span>
              )}
            </div>
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
            <div className="space-y-2">
              <label htmlFor="date_of_birth" className="block font-medium">
                Date of birth
              </label>
              <Controller
                control={control}
                name="date_of_birth"
                rules={{
                  required: {
                    value: true,
                    message: "Date of birth is required",
                  },
                }}
                render={({ field }) => (
                  <DatePicker
                    format={"DD/MM/YYYY"}
                    className="w-full"
                    maxDate={dayjs()}
                    {...field}
                  />
                )}
              />
              {errors.date_of_birth && (
                <span className="text-red-500 block mt-1">
                  {errors.date_of_birth.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="gender" className="block font-medium">
                Gender
              </label>
              <Controller
                control={control}
                name="gender"
                defaultValue="male"
                rules={{
                  required: { value: true, message: "Gender is required" },
                }}
                render={({ field }) => (
                  <Select
                    className="w-full"
                    options={[
                      {
                        value: "male",
                        label: "Male",
                      },
                      {
                        value: "female",
                        label: "Female",
                      },
                    ]}
                    {...field}
                  />
                )}
              />
              {errors.gender && (
                <span className="text-red-500 block mt-1">
                  {errors.gender.message}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <h4 className="font-nunito font-bold">Avatar</h4>
              <div className="flex items-center gap-3">
                <div className="h-24">
                  <Controller
                    control={control}
                    name="avatar"
                    render={({ field: { onChange } }) => (
                      <AvatarUpload setFile={onChange} />
                    )}
                  />
                </div>
                <div>
                  <h4 className="font-nunito font-bold w-fit">
                    Upload your photo
                  </h4>
                  <p className="text-xs">
                    Profile picture should be in the standard format png, jpg &
                    no more than 2MB.
                  </p>
                </div>
              </div>
            </div>
            <Button
              htmlType="submit"
              type="primary"
              className="w-full"
              size="large"
              loading={isSubmitting || isLoading}
            >
              Register
            </Button>
          </form>
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
          <p className="mt-4">
            Have an account already?{" "}
            <Link className="font-bold" href={ROUTES.LOGIN()}>
              Please login here
            </Link>
          </p>
        </Card>
        <div className="mt-4">
          <p className="text-center text-gray-500">
            By joining {masterData?.allSettings.generalSettingsTitle}, you agree
            to our{" "}
            <Link
              href={"/terms-of-use"}
              className="text-primary-600 hover:underline font-bold"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              href={"/privacy-policy"}
              className="text-primary-600 hover:underline font-bold"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}

PageRegister.Layout = AuthLayout;
