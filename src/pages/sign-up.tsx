import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithField } from "@/components/input-with-field"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

export default function SignUp() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!")
            return
        }

        setLoading(true)
        const { error } = await signUp(name, email, password)
        setLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success("Account created successfully!")
            navigate('/')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center flex flex-col items-center">
                    <img src="/balancify.png" alt="Balancify Logo" className="w-28 h-28 object-contain mb-2" />
                    <CardTitle className="text-2xl font-bold">Welcome to Balancify</CardTitle>
                    <CardDescription>
                        Create your account today to start seamlessly managing your daily transactions!
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <InputWithField
                            id="username"
                            label="Full Name"
                            type="text"
                            value={name}
                            onChange={setName}
                            placeholder="John Doe"
                        />
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
                            placeholder="Create a password"
                        />
                        <InputWithField
                            id="confirm-password"
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm your password"
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Signing up..." : "Sign Up"}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/sign-in" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
