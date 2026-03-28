import { SelectWithField } from "./select-with-field"
import type { SelectItemType } from "./select-with-field"

interface TransactionTypeSelectProps {
    id?: string;
    label?: string;
    value?: string;
    onChange: (value: string) => void;
    errorMessage?: string;
    description?: string;
    placeholder?: string;
}

const transactionTypes: SelectItemType[] = [
    { label: "Income", value: "income" },
    { label: "Expense", value: "expense" }
]

export function TransactionTypeSelect({
    id = "transaction-type",
    label = "Transaction Type",
    value,
    onChange,
    errorMessage,
    description,
    placeholder = "Select transaction type"
}: TransactionTypeSelectProps) {
    return (
        <SelectWithField
            id={id}
            label={label}
            items={transactionTypes}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            errorMessage={errorMessage}
            description={description}
        />
    )
}
