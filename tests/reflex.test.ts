import { it, expect } from "vitest";
import {
  decide,
  decisionRequest,
  validateDecision,
} from "../packages/reflex/reflex.js";
const body = () => ({
  model: "typesafe/jev-test",
  usage: { input_tokens: 20, output_tokens: 10, cost: 0.0001 },
  answers: {
    route: {
      type: "choice",
      choice: "general",
      confidence: 0.95,
      probabilities: {
        vault: 0.01,
        communication: 0.01,
        task: 0.01,
        general: 0.96,
        insufficient: 0.01,
      },
    },
    ...Object.fromEntries(
      ["complete", "addressed", "action", "vault"].map((k) => [
        k,
        { type: "noul", noul: 0.1 },
      ]),
    ),
  },
});
it("uses the real decisions endpoint and preserves model, probabilities, cost and trusted metadata", async () => {
  let request: any;
  const result = await decide(
    { text: "oi", candidates: [] },
    {
      enabled: true,
      key: "test",
      fetcher: (async (url, init) => {
        expect(url).toBe("https://openrouter.ai/api/alpha/decisions");
        request = JSON.parse(init!.body as string);
        return Response.json(body());
      }) as typeof fetch,
    },
  );
  expect(request.model).toBe("~typesafe/jev-latest");
  expect(Object.keys(request.questions)).toHaveLength(5);
  expect(result.source).toBe("jev");
  expect(result.route).toBe("general");
  expect(result.next).toBe("answer");
  expect(result.vault).toBe("none");
  expect(result.usage?.cost).toBe(0.0001);
});
it("bad probability distributions, uncertain route and HTTP failures are conservative", async () => {
  const bad = body();
  bad.answers.route.probabilities.general = 0.1;
  expect(() => validateDecision(bad)).toThrow();
  const uncertain = body();
  uncertain.answers.route.confidence = 0.2;
  expect(
    (
      await decide(
        { text: "oi" },
        {
          enabled: true,
          key: "x",
          fetcher: (async () => Response.json(uncertain)) as typeof fetch,
        },
      )
    ).route,
  ).toBe("insufficient");
  expect(
    (
      await decide(
        { text: "oi" },
        {
          enabled: true,
          key: "x",
          fetcher: (async () =>
            new Response("", { status: 429 })) as typeof fetch,
        },
      )
    ).fallbackReason,
  ).toBe("http_429");
});
it("bounds context, does not invent probabilities offline, and propagates cancellation", async () => {
  const input = {
    text: "x".repeat(11000),
    candidates: Array.from({ length: 10 }, () => ({
      id: "a",
      title: "a",
      content: "a".repeat(1000),
    })),
  };
  const request = decisionRequest(input);
  expect(request.state.text).toHaveLength(10000);
  expect(request.state.candidates).toHaveLength(6);
  expect(request.state.candidates[0].excerpt).toHaveLength(600);
  expect((await decide(input)).answers).toBeUndefined();
  const controller = new AbortController();
  controller.abort();
  await expect(
    decide(input, { enabled: true, key: "x", signal: controller.signal }),
  ).rejects.toThrow();
});
