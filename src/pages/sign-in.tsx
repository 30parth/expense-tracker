import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithField } from "@/components/input-with-field"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

export default function SignIn() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await signIn(email, password)
        setLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success("Signed in successfully!")
            navigate('/')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your email below to sign in to your account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <InputWithField
                            id="email"
                            label="Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="Enter your email"
                        />
                        <InputWithField
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            placeholder="••••••••"
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/sign-up" className="text-primary hover:underline font-medium">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
