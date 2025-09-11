"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema } from "@/schemas/user-schema";
import {  useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginData } from "@/types/auth";
import { IconLogout } from "@tabler/icons-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    setIsExecuting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.error || "Login failed");
      } else {
        router.replace(result.redirectTo || "/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card style={{ backgroundColor: "#CE0000" }}>
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <IconLogout className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-primary-foreground">Login to your account</CardTitle>
          <CardDescription className="text-primary-foreground">
            Enter your email and password to login
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input 
                          className="bg-white"
                          placeholder="m@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-white">Password</FormLabel>
                      </div>
                      <FormControl>
                        <Input className="bg-white" type="password" {...field} placeholder="password"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {errorMessage && (
                  <div className="text-sm font-medium text-white">
                    {errorMessage}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isExecuting}>
                  {isExecuting ? <Loader2 className="animate-spin size-4" /> : "Login"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
