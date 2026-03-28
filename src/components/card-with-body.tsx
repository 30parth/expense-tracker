import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type React from "react"

interface CardProps {
    titel: string,
    children: React.ReactNode,
    description: string,
    footer: React.ReactNode,
}

export const CardWithBody = ({ titel, children, description, footer }: CardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{titel}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
            {footer && (
                <CardFooter>
                    {footer}
                </CardFooter>
            )}
        </Card>
    )
}
