import { Box, Flex, Text } from "@chakra-ui/react";
import Lottie from "lottie-react";
import animationData from "./loading.json"; // Adjust the path

const LoadingAnimation = () => {
  return (
    <Flex align="center" justify="center" height="250px" direction="column" gap={4}>
  {/* First Box */}
  <Box width="800px" display="flex" alignItems="center" justifyContent="center">

  {/* Second Box */}
  <Box width="300px" display="flex" alignItems="center" justifyContent="center">
    <Lottie animationData={animationData} loop autoplay />
  </Box>
  </Box>
</Flex>


  );
};

export default LoadingAnimation;