import type { Campaign, DemoState, Performance } from "./types";

export function progress(campaign: Campaign) {
  return campaign.checklist.length
    ? Math.round(
        (campaign.checklist.filter((item) => item.done).length / campaign.checklist.length) * 100
      )
    : 0;
}
export function metrics(samples: Performance[]) {
  const totals = samples.reduce(
    (result, sample) => ({
      revenue: result.revenue + sample.revenue,
      spend: result.spend + sample.spend,
      impressions: result.impressions + sample.impressions,
      clicks: result.clicks + sample.clicks,
      orders: result.orders + sample.orders,
    }),
    { revenue: 0, spend: 0, impressions: 0, clicks: 0, orders: 0 }
  );
  return {
    ...totals,
    roas: totals.spend ? totals.revenue / totals.spend : 0,
    ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
  };
}
export function filteredPerformance(
  state: DemoState,
  start: string,
  end: string,
  channel = "",
  campaignId = ""
) {
  const ids = new Set(
    state.campaigns
      .filter(
        (campaign) =>
          (!channel || campaign.channel === channel) && (!campaignId || campaign.id === campaignId)
      )
      .map((campaign) => campaign.id)
  );
  return state.performance.filter(
    (sample) => ids.has(sample.campaignId) && sample.date >= start && sample.date <= end
  );
}
export function assertRelationships(state: DemoState) {
  const members = new Set(state.members.map((item) => item.id));
  const campaigns = new Set(state.campaigns.map((item) => item.id));
  const knownCampaign = (value: string) => !value || campaigns.has(value);
  for (const list of [
    state.members,
    state.campaigns,
    state.leads,
    state.documents,
    state.threads,
    state.tickets,
    state.activity,
    state.notifications,
  ]) {
    if (new Set(list.map((item) => item.id)).size !== list.length)
      throw new Error("Duplicate record ID");
  }
  if (!members.has(state.profile.id)) throw new Error("Unknown profile member");
  if (
    state.campaigns.some(
      (item) => !members.has(item.ownerId) || item.memberIds.some((value) => !members.has(value))
    )
  )
    throw new Error("Unknown campaign member");
  if (state.leads.some((item) => !members.has(item.ownerId) || !knownCampaign(item.campaignId)))
    throw new Error("Unknown lead relationship");
  if (
    state.documents.some((item) => !knownCampaign(item.campaignId)) ||
    state.performance.some((item) => !campaigns.has(item.campaignId))
  )
    throw new Error("Unknown campaign relationship");
  if (
    state.threads.some(
      (item) =>
        !knownCampaign(item.campaignId) ||
        item.messages.some((message) => !members.has(message.memberId))
    )
  )
    throw new Error("Unknown chat relationship");
}
