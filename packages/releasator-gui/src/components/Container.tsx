import styled from "styled-components";

export const Container = styled.div`
    display: grid;
    place-items: center;
    height: 100vh;
    padding: 0 100px;
    @media (max-width: 720px) {
        padding: 0;
    }
    grid-template-columns: 1fr auto 1fr;
`;

export const ItemCenter = styled.div`
    max-width: 640px;
    grid-column: 2;
`;
