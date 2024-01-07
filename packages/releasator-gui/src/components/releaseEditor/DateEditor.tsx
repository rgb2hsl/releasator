import {
    getDate,
    getHours,
    getMinutes,
    getMonth,
    getYear,
    lastDayOfMonth,
    setDate,
    setHours,
    setMinutes,
    setMonth,
    setYear
} from "date-fns";
import * as React from "react";
import {CatchError} from "../CatchError";
import {FlexCol} from "../FlexCol";
import {TextInputWrapper} from "../TextInputWrapper";
import {FlexRow} from "../FlexRow";
import {UTCDate} from "@date-fns/utc";
import {sqliteDate} from "releasator-types";

export function DateEditor(props: {
    utc?: boolean,
    isoString: string,
    onChange: (isoString: string) => void
}) {
    const date = props.utc === true ? new UTCDate(props.isoString) : new Date(props.isoString);

    return <CatchError fallback={
        <FlexCol $gap={5}>
            <p>Warning! An error occured during parsing date. Fallback to a simple editor:</p>
            <TextInputWrapper
                derivedValue={`${props.isoString}`}
                handleChange={value => {
                    props.onChange(value);
                }}
            />
        </FlexCol>
    }>
        <FlexRow $gap={5} style={{alignItems: "last baseline"}}>
            <FlexCol $gap={2}>
                <p style={{paddingLeft: 8}}>Year</p>
                <TextInputWrapper
                    derivedValue={getYear(date)}
                    handleChange={(value, reset) => {
                        try {
                            props.onChange(sqliteDate(setYear(date, +value)));
                        } catch {
                            reset();
                        }
                    }}
                />
            </FlexCol>
            <p>{"."}</p>
            <FlexCol $gap={2}>
                <p style={{paddingLeft: 8}}>Mnth</p>
                <TextInputWrapper
                    derivedValue={getMonth(date) + 1}
                    handleChange={(value, reset) => {
                        try {
                            if (+value > 12 || +value <= 0) reset();
                            else props.onChange(sqliteDate(setMonth(date, +value - 1)));
                        } catch {
                            reset();
                        }
                    }}
                />
            </FlexCol>
            <p>{"."}</p>
            <FlexCol $gap={2}>
                <p style={{paddingLeft: 8}}>Day</p>
                <TextInputWrapper
                    derivedValue={getDate(date)}
                    handleChange={(value, reset) => {
                        try {
                            if (+value > getDate(lastDayOfMonth(date)) || +value <= 0) reset();
                            else props.onChange(sqliteDate(setDate(date, +value)));
                        } catch {
                            reset();
                        }
                    }}
                />
            </FlexCol>
            <p style={{paddingLeft: 8}}>{" "}</p>
            <FlexCol $gap={2}>
                <p style={{paddingLeft: 8}}>Hrs</p>
                <TextInputWrapper
                    derivedValue={getHours(date)}
                    handleChange={(value, reset) => {
                        try {
                            if (+value >= 24 || +value <= 0) reset();
                            else props.onChange(sqliteDate(setHours(date, +value)));
                        } catch {
                            reset();
                        }
                    }}
                />
            </FlexCol>
            <p>{":"}</p>
            <FlexCol $gap={2}>
                <p style={{paddingLeft: 8}}>Mnts</p>
                <TextInputWrapper
                    derivedValue={getMinutes(date)}
                    handleChange={(value, reset) => {
                        try {
                            if (+value >= 60 || +value <= 0) reset();
                            else props.onChange(sqliteDate(setMinutes(date, +value)));
                        } catch {
                            reset();
                        }
                    }}
                />
            </FlexCol>

        </FlexRow>
    </CatchError>;
}
