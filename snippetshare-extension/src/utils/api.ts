import { getFirebaseToken } from "../extension";

const BACKEND_URL = "http://127.0.0.1:8000";

// Define type for workspace (you can expand this later)
interface Workspace {
  workspaceId: string;
  name: string;
  type: string;
  members: string[];
  createdBy: string;
  createdAt?: string;
}

// Fetch workspaces API
export async function fetchWorkspaces(): Promise<Workspace[]> {
  const token = getFirebaseToken();
  if (!token) {
    throw new Error("Firebase token is missing. Please login first.");
  }

  const response = await fetch(`${BACKEND_URL}/api/workspaces`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
  }

  const data = (await response.json()) as Workspace[];
  return data;
}

// Example: Create a workspace
export async function createWorkspace(
  name: string,
  type: "private" | "custom",
  members: string[] = []
): Promise<{ workspaceId: string }> {
  const token = getFirebaseToken();
  if (!token) {
    throw new Error("Firebase token is missing. Please login first.");
  }

  const response = await fetch(`${BACKEND_URL}/api/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, type, members }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create workspace: ${response.statusText}`);
  }

  return (await response.json()) as { workspaceId: string };
}
