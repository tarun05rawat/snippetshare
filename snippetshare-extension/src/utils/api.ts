import { getFirebaseToken } from "../extension";

const BACKEND_URL = "https://snippetshare-flask.onrender.com";

// Define type for workspace (you can expand this later)
interface Workspace {
  workspaceId: string;
  name: string;
  type: string;
  members: string[];
  createdBy: string;
  createdAt?: string;
}

interface SnippetPayload {
  title: string;
  code: string;
  tags: string[];
  workspaceId: string;
}

//Create workspace API
export async function createWorkspace(
  token: string,
  data: { name: string; type: string }
) {
  const response = await fetch(`${BACKEND_URL}/api/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    const error = errorResponse as { error: string };
    throw new Error(error.error || "Failed to create workspace.");
  }

  return await response.json();
}

// Fetch workspaces API
export async function fetchWorkspaces(token: string): Promise<Workspace[]> {
  const response = await fetch(`${BACKEND_URL}/api/workspaces`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    const error = errorResponse as { error: string };
    throw new Error(error.error || "Unknown error while fetching workspaces.");
  }

  return response.json() as Promise<Workspace[]>;
}

//Delete Workspace API
export async function deleteWorkspace(token: string, workspaceId: string) {
  const response = await fetch(`${BACKEND_URL}/api/workspaces/${workspaceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    const error = errorResponse as { error: string };
    throw new Error(error.error || "Failed to delete workspace.");
  }

  return await response.json();
}

// Add member to workspace API
export async function addMembersToWorkspace(
  token: string,
  workspaceId: string,
  members: string[]
) {
  const response = await fetch(
    `${BACKEND_URL}/api/workspaces/${workspaceId}/members/add`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ members }),
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    const error = errorResponse as { error: string };
    throw new Error(error.error || "Unknown error while adding members.");
  }

  return await response.json();
}

// Fetch snippets API
export async function fetchSnippets(token: string, workspaceId: string) {
  const response = await fetch(
    `${BACKEND_URL}/api/snippets?workspace=${workspaceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const data = (await response.json()) as { error: string };
    throw new Error(data.error || "Failed to fetch snippets");
  }

  const data = await response.json();
  return data;
}

// Create snippet API
export async function createSnippet(token: string, snippet: SnippetPayload) {
  const response = await fetch(`${BACKEND_URL}/api/snippets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(snippet),
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    const error = errorResponse as { error: string };
    throw new Error(error.error || "Unknown error while creating snippet.");
  }

  return await response.json();
}

// Search snippets API
export async function searchSnippets(
  token: string,
  workspaceId: string,
  query: string
) {
  const url = `${BACKEND_URL}/api/snippets/search?workspace=${workspaceId}&query=${encodeURIComponent(
    query
  )}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "Search failed");
  }

  return await response.json();
}
