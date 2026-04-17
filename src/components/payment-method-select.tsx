import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { SelectWithField } from "./select-with-field"
import type { SelectItemType } from "./select-with-field"

interface PaymentMethodSelectProps {
    id?: string;
    label?: string;
    value?: string;
    onChange: (value: string) => void;
    errorMessage?: string;
    description?: string;
    placeholder?: string;
    showAllOption?: boolean;
}

export function PaymentMethodSelect({
    id = "payment-method",
    label = "Payment Method",
    value,
    onChange,
    errorMessage,
    description,
    placeholder = "Select a payment method",
    showAllOption = false
}: PaymentMethodSelectProps) {
    const { user } = useAuth()
    const [methods, setMethods] = useState<SelectItemType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMethods = async () => {
            if (!user) {
                setLoading(false)
                return
            }
            
            setLoading(true)
            const { data, error } = await supabase
                .from('payment_type')
                .select('id, payment_name, current_balance')
                .eq('user_id', user.id)
                .order('payment_name', { ascending: true })

            if (!error && data) {
                const fetchedMethods = data.map((method) => ({
                    label: `${method.payment_name} ($${Number(method.current_balance).toFixed(2)})`,
                    value: method.id.toString(),
                }))
                
                if (showAllOption) {
                    setMethods([
                        { label: "All Wallets", value: "all" },
                        ...fetchedMethods
                    ])
                } else {
                    setMethods(fetchedMethods)
                }
            }
            setLoading(false)
        }

        fetchMethods()
    }, [user])

    return (
        <SelectWithField
            id={id}
            label={label}
            items={methods}
            value={value}
            onChange={onChange}
            placeholder={loading ? "Loading methods..." : (methods.length === 0 ? "No methods found" : placeholder)}
            errorMessage={errorMessage}
            description={description}
        />
    )
}
