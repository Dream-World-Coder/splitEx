import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState<{ email: string; password: string }>({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                "http://127.0.0.1:3000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: form.email,
                        password: form.password,
                    }),
                },
            );

            const data = await response.json();
            if (response.ok) {
                login(data.token);
                toast.success("Login Successful!");
                setTimeout(() => {
                    navigate("/");
                }, 300);
            } else {
                toast.error(data.error || "Login failed!");
            }
        } catch (error) {
            console.error("SignIn Error:", error);
            toast.error("Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to log in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-6"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <a
                                    href="#"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password?
                                </a>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                        <Button variant="outline" className="w-full">
                            Login with Google
                        </Button>
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <div
                                onClick={() => navigate("/register")}
                                className="underline underline-offset-4 cursor-pointer inline"
                            >
                                Sign up
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
