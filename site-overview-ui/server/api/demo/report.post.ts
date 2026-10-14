import { array, object, string } from "yup";

import { runReport } from "../../../shared/analytics";
import { goalSchema, reportQuerySchema } from "../../../shared/schemas";
import type { Goal, ReportQuery } from "../../../shared/types";
import { datasetFor } from "../../utils/fixtures";
import { validatedBody } from "../../utils/validation";

/**
 * Runs a report. The client sends the question (range, segment, filters), the goals to evaluate and
 * the site's page list; the server owns the traffic data and does the counting.
 */
export default defineEventHandler(async (event) => {
  const body = await validatedBody(
    event,
    object({
      query: reportQuerySchema.required(),
      site: object({
        id: string().required().max(80),
        pages: array()
          .of(object({ path: string().required().max(200), title: string().required().max(120) }))
          .required()
          .max(40),
      }).required(),
      goals: array().of(goalSchema).required().max(40),
      funnel: array().of(string().required()).required().max(12),
    })
  );
  if (body.query.siteId !== body.site.id)
    throw createError({ statusCode: 400, statusMessage: "The report and site don't match" });
  const dataset = datasetFor({ id: body.site.id, pages: body.site.pages });
  return runReport(dataset, body.query as ReportQuery, {
    goals: body.goals as Goal[],
    funnel: body.funnel,
  });
});
