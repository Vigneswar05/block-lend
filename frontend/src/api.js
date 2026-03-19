import axios from "axios";

const API = axios.create({
  baseURL: "https://blocklend-backend.onrender.com",
});

export default API;