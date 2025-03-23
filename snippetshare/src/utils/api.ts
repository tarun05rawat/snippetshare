const fetch = require("node-fetch");
import { getFirebaseToken } from "../extension";

export async function fetchWorkspaces() {
  const token = getFirebaseToken();
  if (!token) {
    throw new Error("No Firebase token found. Please log in first.");
  }

  const response = await fetch("http://localhost:8000/api/workspaces", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Unknown error");
  }

  return await response.json();
}
