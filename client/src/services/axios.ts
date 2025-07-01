// Option 2: Create an instance with custom config (recommended)
import axios from "axios";

const customAxios = axios.create({
  baseURL: "http://192.168.10.155:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

export default customAxios;
