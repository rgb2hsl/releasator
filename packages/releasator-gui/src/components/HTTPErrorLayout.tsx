import * as React from "react";
import {Container, ItemCenter} from "./Container";
import {Monitor} from "react95";
import {ErrorHeader} from "./ErrorHeader";

export const HTTPErrorLayout: React.FC<{
    message: string
}> = ({message}) => (
    <Container>
        <ItemCenter>
            <Monitor backgroundStyles={{background: "blue"}}/>
            <ErrorHeader>{message}</ErrorHeader>
        </ItemCenter>
    </Container>
);
