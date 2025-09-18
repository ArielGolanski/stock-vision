const axios = require("axios");

async function fetchTopGainers() {
  try {
    const response = await axios.get("YOUR_STOCK_API_URL");
    return response.data;
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return [];
  }
}

module.exports = fetchTopGainers;
