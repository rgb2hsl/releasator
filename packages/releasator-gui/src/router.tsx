import {createBrowserRouter} from "react-router-dom";
import * as React from "react";
import {PageRoot} from "./routes/PageRoot";
import {PageReleaseEdit, releaseEditLoader} from "./routes/PageReleaseEdit";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <PageRoot/>,
        children: [
            {
                path: "/release/:id/edit/:hash",
                element: <PageReleaseEdit/>,
                loader: releaseEditLoader
            }
        ]
    }
]);
