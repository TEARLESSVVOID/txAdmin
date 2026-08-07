import React from "react";
import { Box, styled, Typography } from "@mui/material";

const StyledTypography = styled(Typography)({
  alignSelf: "center",
  marginTop: "auto",
  marginBottom: "auto",
  opacity: 0.5,
});

export const DialogLoadError: React.FC = () => {
  return (
    <Box p={2} height="100%" display="flex" flexDirection="column">
      <StyledTypography variant="h5">
        玩家数据加载失败 :(
      </StyledTypography>
    </Box>
  );
};
