import styled from "styled-components";

export const FlexRow = styled.div<{ $gap: number }>`
  display: flex;
  flex-direction: row;
  gap: ${props => props.$gap}px;
  align-items: baseline;
`;
