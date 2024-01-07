import * as React from "react";
import {type ReactNode, useEffect, useState} from "react";
import {UTCDate} from "@date-fns/utc";

const useCountdown = (targetDate: UTCDate | Date) => {
    const toTimestamp = targetDate.getTime();

    const initial = toTimestamp - new UTCDate().getTime();

    const [diffTS, setDiffTS] = useState(
        initial > 0 ? initial : 0
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = toTimestamp - new UTCDate().getTime();
            setDiffTS(diff > 0 ? diff : 0);
        }, 50);

        return () => {
            clearInterval(interval);
        };
    }, [toTimestamp]);

    return getReturnValues(diffTS);
};

const getReturnValues = (diffTS: number) => {
    // calculate time left
    const days = Math.floor(diffTS / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (diffTS % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffTS % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffTS % (1000 * 60)) / 1000);

    const milliseconds = Math.floor(diffTS % 1000);

    return {
        days, hours, minutes, seconds, milliseconds, diffTS
    };
};

function pad(num: number, size: number) {
    let str = num.toString();
    while (str.length < size) str = "0" + str;
    return num;
}

export function Countdown(props: {
    countdownPrefix: ReactNode,
    timesUp: ReactNode,
    date: UTCDate | Date
}) {
    const cd = useCountdown(props.date);

    if (cd.diffTS <= 0) {
        return props.timesUp;
    }

    if (cd.days > 0) {
        return <>
            {props.countdownPrefix} {cd.days} days, {cd.hours} hours, {cd.minutes} minutes
        </>;
    } else if (cd.hours > 0) {
        return <>
            {props.countdownPrefix} {cd.hours} hours, {cd.minutes} minutes
        </>;
    } else if (cd.minutes > 15) {
        return <>
            {props.countdownPrefix} {cd.hours} hours, {cd.minutes} minutes, {cd.seconds} seconds
        </>;
    } else {
        const blink = cd.seconds % 2 === 1;
        return <span style={{color: blink ? "tomato" : ""}}>
      {props.countdownPrefix} {cd.hours} hours, {cd.minutes} minutes, <span style={{
            display: "inline-block",
            width: "6ch"
        }}>{cd.seconds}.{pad(cd.milliseconds, 3)}</span>
      seconds
    </span>;
    }
}
