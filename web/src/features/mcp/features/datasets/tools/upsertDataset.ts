import { z } from "zod";
import { createDatasetForApi } from "@/src/features/datasets/server/publicDatasetService";
import {
  PostDatasetsV2Body,
  PostDatasetsV2Response,
} from "@/src/features/public-api/types/datasets";
import { defineTool } from "../../../core/define-tool";
import { runMcpTool } from "../../../core/run-mcp-tool";

const idField = z.string().min(1).optional();

const UpsertDatasetBaseSchema = z.object({
  id: idField,
  name: z.string(),
  description: z.string().optional(),
  metadata: z.any().optional(),
  inputSchema: z.any().optional(),
  expectedOutputSchema: z.any().optional(),
});

const UpsertDatasetInputSchema = PostDatasetsV2Body.extend({
  id: idField,
});

export const [upsertDatasetTool, handleUpsertDataset] = defineTool({
  name: "upsertDataset",
  description:
    "Upsert a dataset, a named collection of input and optional expected-output examples for experiments and evaluations.",
  baseSchema: UpsertDatasetBaseSchema,
  inputSchema: UpsertDatasetInputSchema,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.datasets.upsert",
      context,
      attributes: { "mcp.dataset_name": input.name },
      fn: async () => {
        const dataset = await createDatasetForApi({
          input,
          projectId: context.projectId,
          auditScope: context,
        });

        return PostDatasetsV2Response.parse(dataset);
      },
    }),
  destructiveHint: true,
});
