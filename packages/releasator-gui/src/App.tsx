import * as React from "react";
import {ThemeProvider} from "styled-components";
import {RouterProvider} from "react-router-dom";
import original from "react95/dist/themes/original";
import {GlobalStyles} from "./GlobalStyles";
import {router} from "./router";

export const App = () => (
    <div>
        <GlobalStyles/>
        <ThemeProvider theme={original}>
            <RouterProvider router={router}/>
        </ThemeProvider>
    </div>
);
