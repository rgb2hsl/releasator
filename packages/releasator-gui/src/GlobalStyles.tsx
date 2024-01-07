import {createGlobalStyle} from "styled-components";
import {styleReset} from "react95";

export const GlobalStyles = createGlobalStyle`
  ${styleReset}
  body {
    font-family: 'ms_sans_serif';
    background-color: cadetblue;
      @media(max-width: 720px) {
          zoom: .8;
      }
  }
`;
