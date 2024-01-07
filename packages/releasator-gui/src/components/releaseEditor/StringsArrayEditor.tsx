import {FlexCol} from "../FlexCol";
import * as React from "react";
import {FlexRow} from "../FlexRow";
import {TextInputWrapper} from "../TextInputWrapper";
import {Button} from "react95";
import {type ValidationError} from "releasator-types";
import {ErrorsDisplay} from "./ErrorsDisplay";

interface ArrayEditorProps<T> {
    entityName: string;
    array: T[];
    onUpdate: (array: T[]) => void;
    newItem: T;
    extract: (item: T) => string;
    contract: (val: string) => T | undefined;
    errorsPath: string;
    errors: ValidationError[];
    setErrros: (errors: ValidationError[]) => void;
}

export function StringsArrayEditor<T>(props: ArrayEditorProps<T>) {

    return <>
        <FlexCol $gap={10}>
            {props.array.map((el, i) => <React.Fragment key={props.extract(el)}>

                <FlexRow $gap={10}>

                    {/* Value editor */}
                    <TextInputWrapper
                        derivedValue={props.extract(el)}
                        handleChange={(value, reset) => {
                            const newElement = props.contract(value);

                            if (newElement !== undefined) {
                                props.onUpdate([...props.array.slice(0, i), newElement, ...props.array.slice(i + 1)]);
                            } else {
                                reset();
                            }
                        }}
                        fullWidth
                    />

                    {/* Order buttons and Delete */}
                    <FlexRow $gap={0}>
                        <Button
                            onClick={() => {
                                const a = [...props.array];

                                if (i > 0 && i < a.length) {
                                    [a[i - 1], a[i]] = [a[i], a[i - 1]];
                                }

                                props.onUpdate(a);
                            }}
                        >
                            ⬆️
                        </Button>
                        <Button
                            onClick={() => {
                                const a = [...props.array];

                                if (i >= 0 && i < a.length - 1) {
                                    [a[i], a[i + 1]] = [a[i + 1], a[i]];
                                }

                                props.onUpdate(a);
                            }}
                        >
                            ⬇️
                        </Button>
                        <Button
                            style={{backgroundColor: "tomato"}}
                            onClick={() => {
                                const a = [...props.array];

                                a.splice(i, 1);

                                props.setErrros(props.errors.filter(error => !error.path.join("/").startsWith(`${props.errorsPath}/${i}`)))

                                props.onUpdate(a);
                            }}
                        >
                            Del
                        </Button>
                    </FlexRow>

                </FlexRow>

                <ErrorsDisplay errors={props.errors} paths={[`${props.errorsPath}/${i}`]}/>

            </React.Fragment>)}
            <Button
                onClick={() => {
                    props.onUpdate([...props.array, props.newItem]);
                }}
            >
                + Add {props.entityName}
            </Button>
        </FlexCol>
    </>;
}
