import axios from "axios";

const token = "pat:NBhIpLXFL2L4q25fAJexFZ8OAhtKZDNtt4BVaEVx";
// Use environment variable for the token

async function getData() {
  try {
    const response = await axios.get(
      `https://arcon.drupal-wiki.net/node/1196?_format=json`,
      {
        headers: {
          "X-Auth-Token": token,
          "Content-Type": "application/json",
          "Accept": "application/json", // Explicitly request JSON
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );
    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);
    return response.data; // Return the fetched data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching data:", error.response?.data || error.message);
    } else {
      console.error("Error fetching data:", error);
    }
    throw error; // Re-throw the error for further handling
  }
}

getData()
  .then((data) => {
    console.log("Data fetched successfully:", data);
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
