import RateEstimateForm from "../components/RateEstimateForm.js";
import SideBar from "../components/SideBar.js";
import { Box, Heading, Center } from "@chakra-ui/react";

function CreateShipment() {
  return (
    <Box display="flex" minHeight="100vh">
      {/* Sidebar */}
      <Box w={{ base: "80px", md: "250px" }} bg="gray.700" color="white">
        <SideBar />
      </Box>
      {/* Main Content */}
      <Box
  flex="1"
  p={6}
  bgGradient="linear(to-br, teal.50, blue.50)"
  display="flex"
  flexDirection="column"
  alignItems="center"
  pt={0} // Set top padding to 0
>
  {/* Header */}
  <Center mb={6}>
    <Heading
      fontSize={{ base: "2xl", md: "3xl" }}
      fontWeight="bold"
      bgGradient="linear(to-r, teal.400, blue.400)"
      bgClip="text"
      textAlign="center"
    >
      {/* Heading content */}
    </Heading>
  </Center>

  {/* Main Forms */}
  <RateEstimateForm />

</Box>
      </Box>
    
  );
}

export default CreateShipment;
