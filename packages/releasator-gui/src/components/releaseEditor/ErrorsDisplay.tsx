import {type ValidationError} from "releasator-types";
import * as React from "react";
import {useMemo} from "react";
import {Frame} from "react95";
import {FlexCol} from "../FlexCol";

export function ErrorsDisplay(props: { errors: ValidationError[], paths?: string[] }) {
    const filteredErrors = useMemo(
        () => props.errors.filter(
            error => props.paths ? props.paths.find(path => error.path.join("/").startsWith(path)) : true
        ), [props.errors, props.paths]
    );

    return filteredErrors.length ? <Frame variant={"well"} style={{backgroundColor: "tomato", padding: 10}}>
        {filteredErrors.map(error => <FlexCol $gap={2}>
            <p>On: {error.path.join("/")}, {error.message}</p>
            {error.expected ? <p>Expected: {error.expected}</p> : null}
            {error.received ? <p>Got: {error.received}</p> : null}
        </FlexCol>)}
    </Frame> : null;
}
