import { Field, FieldDescription, FieldError, FieldLabel } from "./ui/field"
import { Input } from "./ui/input"

interface InputProps {
    id: string,
    label: string,
    type: string,
    value: any,
    placeholder?: string,
    onChange: (value: string) => void,
    errorMessage?: string,
    description?: string,
}

export const InputWithField = ({
    id,
    label,
    type,
    value,
    onChange,
    placeholder,
    errorMessage,
    description,
}: InputProps) => {
    return (
        <Field className="mb-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
                id={id}
                value={value}
                type={type}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                {...(errorMessage && { 'aria-invalid': true })}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </Field>
    )
}
