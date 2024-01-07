import styled from "styled-components";

export const Modal = styled.div`
    display: grid;
    justify-items: center;
    align-items: center;
    background: url("/win95fade.gif"), radial-gradient(circle, rgba(0,0,0,0) 43%, rgba(40,47,49,0.5494572829131652) 100%);
    background-size: 3px 3px; // subpixels will kill you instead, be aware
    position: fixed;
    width: 100vw;
    height: 100vh;
    z-index: 999;
`;
