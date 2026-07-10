export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody {
  message?: string;
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const bodyText = await response.text();
    let message = response.statusText || "Request failed";

    if (bodyText) {
      try {
        const body = JSON.parse(bodyText) as ErrorBody;

        if (typeof body.message === "string") {
          message = body.message;
        }
      } catch {
        message = bodyText;
      }
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
