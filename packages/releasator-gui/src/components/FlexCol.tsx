import styled from "styled-components";

export const FlexCol = styled.div<{ $gap: number }>`
    display: flex;
    flex-direction: column;
    gap: ${props => props.$gap}px;
`;
