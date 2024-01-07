import React, {useEffect, useState} from "react";
import {TextInput} from "react95";
import {type TextInputProps} from "react95/dist/TextInput/TextInput";

export const TextInputWrapper: React.FC<TextInputProps & React.RefAttributes<HTMLInputElement | HTMLTextAreaElement> & {
    derivedValue: string | number | undefined,
    handleChange: (value: string, reset: () => void) => void
}> = ({derivedValue, value, onChange, handleChange, onBlur, ...rest}) => {
    const [inputValue, setInputValue] = useState(derivedValue);

    useEffect(() => {
        setInputValue(derivedValue);
    }, [derivedValue]);

    const handleInputChange = (e: any) => {
        setInputValue(e.target.value);
    };

    const handleBlur = () => {
        if (handleChange && inputValue !== value && inputValue !== undefined) {
            handleChange(`${inputValue}`, () => { setInputValue(derivedValue); });
        }
    };

    return (
        <TextInput
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            {...rest}
        />
    );
};
