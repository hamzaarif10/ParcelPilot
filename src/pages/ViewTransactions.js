import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  Text,
  Flex,
  Center,
  Spinner,
  IconButton,
  VStack,
  Heading,
} from '@chakra-ui/react';
import axios from 'axios';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SideBar from "../components/SideBar.js";

const ViewTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async (page) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/user/getTransactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page,
          limit: 10, // Adjust the limit as needed
        },
      });

      // Update state with the fetched transactions and total pages
      setTransactions(response.data.transactions);
      setTotalPages(response.data.totalPages);
      setLoading(false);  // Set loading to false when data is loaded
    } catch (err) {
      setError('Failed to fetch transactions.');
      setLoading(false);  // Ensure loading is set to false even in case of an error
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]); // Run whenever currentPage changes

  if (loading) {
    return (
      <VStack spacing={4} align="center" minHeight="100vh" bgGradient="linear(to-br, teal.50, blue.50, purple.100)">
        <Heading as="h1" size="xl" mb={4}>Your Transactions</Heading>
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="teal.500" size="xl" />
      </VStack>
    );
  }

  return (
    <Box display="flex" minHeight="100vh" bgGradient="linear(to-br, teal.50, blue.50, purple.100)">
      {/* Sidebar */}
      <Box w={{ base: '80px', md: '250px' }} bg="gray.800" color="white" shadow="lg">
        <SideBar />
      </Box>

      {/* Main Content */}
      <Box flex="1" p={3} bg="white" borderRadius="lg" shadow="2xl" m={2}>
        {/* Header */}
        <Center bgGradient="linear(to-r, teal.400, blue.400)" py={3} mb={2} borderRadius="lg" shadow="lg">
          <Text fontSize={{ base: 'lg', md: '2xl' }} fontWeight="semibold" color="white">
            Your Transactions
          </Text>
        </Center>

        {/* Error Message */}
        {error && <Text color="red.500" mb={4}>{error}</Text>}

        {/* Transaction Table */}
        <Box overflowX="auto" borderRadius="lg" bg="white" shadow="lg" p={4}>
          <Table variant="striped" colorScheme="teal" size="md">
            <TableCaption>Your recent transaction history</TableCaption>
            <Thead>
              <Tr>
                <Th color="teal.600" fontSize="lg" fontWeight="semibold">Reference Number</Th>
                <Th color="teal.600" fontSize="lg" fontWeight="semibold">Description</Th>
                <Th color="teal.600" fontSize="lg" fontWeight="semibold">Amount</Th>
                <Th color="teal.600" fontSize="lg" fontWeight="semibold">Created At</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <Tr
                    key={transaction.reference_number}
                    _hover={{ bg: 'teal.100', transform: 'scale(1.02)' }}
                    transition="0.2s"
                  >
                    <Td fontWeight="bold" color="teal.800">{transaction.reference_number}</Td>
                    <Td>{transaction.description}</Td>
                    <Td isNumeric fontWeight="semibold" color="teal.600">${transaction.amount.toFixed(2)}</Td>
                    <Td>{new Date(transaction.created_at).toLocaleDateString()}</Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={4} textAlign="center" fontStyle="italic" color="gray.500">
                    No transactions found.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>

          {/* Pagination */}
          <Flex justifyContent="center" mt={4} gap={2}>
            <IconButton
              icon={<FiChevronLeft />}
              isDisabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              colorScheme="teal"
            />
            <Text fontSize="lg" color="teal.600">
              Page {currentPage} of {totalPages}
            </Text>
            <IconButton
              icon={<FiChevronRight />}
              isDisabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              colorScheme="teal"
            />
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default ViewTransactions;


