import styled from "styled-components";

export const ScheduleBarGrid = styled.div`
    display: grid;
    row-gap: 10px;
    column-gap: 10px;

    grid-template-rows: auto;
    grid-template-columns: auto auto auto;

    justify-items: end;

    @media (max-width: 720px) {
        grid-template-rows: auto auto auto;
        grid-template-columns: auto;
        justify-items: stretch;
    }

    align-items: baseline;
`;

export const ScheduleBarRow1 = styled.div`
    grid-row: 1 / 1;
    grid-column: 1 / 1;
    @media (max-width: 720px) {
        grid-row: 1 / 1;
        grid-column: 1 / 1;
        * {
            flex: 1
        }
    }
    display: flex;
    flex-direction: row;
    gap: 10px;
`;

export const ScheduleBarRow2 = styled.div`
    grid-row: 1 / 1;
    grid-column: 2 / 2;
    @media (max-width: 720px) {
        grid-row: 2 / 2;
        grid-column: 1 / 1;
        * {
            flex: 1
        }
    }
    display: flex;
    flex-direction: row;
    gap: 10px;
`;

export const ScheduleBarRow3 = styled.div`
    grid-row: 1 / 1;
    grid-column: 3 / 3;
    @media (max-width: 720px) {
        grid-row: 3 / 3;
        grid-column: 1 / 1;
        * {
            flex: 1
        }
    }
    display: flex;
    flex-direction: row;
    gap: 10px;
`;
