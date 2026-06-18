/**
 * flows.test.ts — Tests for the post-ingest FlowProducer DAG.
 *
 * Mocks BullMQ's FlowProducer to verify the atomic DAG structure:
 *   - Parent: refresh-feed-slice on feed-slice queue
 *   - Children: score-article jobs on score queue (one per new article)
 *   - Parent runs only after ALL children complete (atomic guarantee)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock FlowProducer — capture the add() calls to verify DAG structure.
// FlowProducer is called with `new`, so the mock must be a constructor.
const mockFlowAdd = vi.fn().mockResolvedValue({ job: { id: "flow-1" } });

vi.mock("bullmq", () => {
  return {
    FlowProducer: class MockFlowProducer {
      add = mockFlowAdd;
      close = vi.fn();
    },
  };
});

// Mock the queue connection factory (used by getFlowProducer).
vi.mock("@/lib/queue", () => ({
  createQueueConnection: vi.fn(() => ({
    host: "localhost",
    port: 6379,
  })),
}));

// Import AFTER mocks are registered.
const { enqueuePostIngestFlow } = await import("./flows");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("enqueuePostIngestFlow", () => {
  it("creates a flow with parent refresh-feed-slice on feed-slice queue", async () => {
    await enqueuePostIngestFlow({
      newArticleIds: ["art-1"],
      categoryId: "cat-1",
    });

    expect(mockFlowAdd).toHaveBeenCalledTimes(1);
    const flowTree = mockFlowAdd.mock.calls[0]?.[0];
    expect(flowTree.name).toBe("refresh-feed-slice");
    expect(flowTree.queueName).toBe("feed-slice");
  });

  it("passes categoryId to parent job data", async () => {
    await enqueuePostIngestFlow({
      newArticleIds: ["art-1"],
      categoryId: "cat-42",
    });

    const flowTree = mockFlowAdd.mock.calls[0]?.[0];
    expect(flowTree.data).toEqual(
      expect.objectContaining({
        categoryId: "cat-42",
      })
    );
  });

  it("creates one score-article child per new article ID", async () => {
    const newArticleIds = ["art-1", "art-2", "art-3"];

    await enqueuePostIngestFlow({
      newArticleIds,
      categoryId: "cat-1",
    });

    const flowTree = mockFlowAdd.mock.calls[0]?.[0];
    expect(flowTree.children).toHaveLength(3);
    expect(flowTree.children[0].name).toBe("score-article");
    expect(flowTree.children[0].queueName).toBe("score");
    expect(flowTree.children[0].data).toEqual({ articleId: "art-1" });
    expect(flowTree.children[1].data).toEqual({ articleId: "art-2" });
    expect(flowTree.children[2].data).toEqual({ articleId: "art-3" });
  });

  it("handles empty newArticleIds array (no children)", async () => {
    await enqueuePostIngestFlow({
      newArticleIds: [],
      categoryId: "cat-1",
    });

    const flowTree = mockFlowAdd.mock.calls[0]?.[0];
    expect(flowTree.children).toEqual([]);
  });

  it("assigns priority 1 to parent and priority 2 to children", async () => {
    await enqueuePostIngestFlow({
      newArticleIds: ["art-1"],
      categoryId: "cat-1",
    });

    const flowTree = mockFlowAdd.mock.calls[0]?.[0];
    expect(flowTree.opts.priority).toBe(1);
    expect(flowTree.children[0].opts.priority).toBe(2);
  });

  it("does NOT throw when FlowProducer.add succeeds", async () => {
    await expect(
      enqueuePostIngestFlow({
        newArticleIds: ["art-1"],
        categoryId: "cat-1",
      })
    ).resolves.toBeUndefined();
  });
});
