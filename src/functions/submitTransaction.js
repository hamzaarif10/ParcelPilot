import axios from 'axios';

// Submit transaction details to the database
export async function submitTransaction({ description, amount }) {
    const token = localStorage.getItem("authToken");

    try {
        await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/user/submitTransaction`, // Matches backend route
            {
                description, // Pass description as string
                amount // Pass amount as a decimal
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    } catch (error) {}
}
