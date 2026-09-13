export async function api<T = any>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const r = await fetch("/api" + path, {
    ...init,
    headers: {
      "x-jarvis-request": "1",
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Não foi possível concluir.");
  return data;
}
export const post = (path: string, body: any = {}) =>
  api(path, { method: "POST", body: JSON.stringify(body) });
export const patch = (path: string, body: any) =>
  api(path, { method: "PATCH", body: JSON.stringify(body) });
export const remove = (path: string) => api(path, { method: "DELETE" });
