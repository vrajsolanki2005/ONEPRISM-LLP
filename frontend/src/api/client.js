// src/api/client.js
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const client = axios.create({
  baseURL: API_BASE_URL,
});

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export const errorMessage = "Something went wrong with the API request.";

export default client; // optional, if you want default too

