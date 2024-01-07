import * as React from "react";
import {type ReactNode} from "react";

export class CatchError extends React.Component<{ fallback: ReactNode, children: ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(error: unknown) {
        // Update state so the next render will show the fallback UI.
        console.error(error);
        return {hasError: true};
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}
