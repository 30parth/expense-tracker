import { Field, FieldDescription, FieldError, FieldLabel } from "./ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select"

export interface SelectItemType {
    label: string;
    value: string;
}

interface SelectWithFieldProps {
    id: string;
    label: string;
    items: SelectItemType[];
    onChange: (value: string) => void;
    value?: string;
    placeholder?: string;
    errorMessage?: string;
    description?: string;
}

export const SelectWithField = ({
    id,
    label,
    items,
    onChange,
    value,
    placeholder,
    errorMessage,
    description,
}: SelectWithFieldProps) => {
    return (
        <Field className="mb-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} {...(errorMessage ? { 'aria-invalid': true } : {})}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </Field>
    )
}
