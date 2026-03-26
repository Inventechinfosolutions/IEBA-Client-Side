export const scheduleTimeStudyKeys = {
  all: ["scheduleTimeStudy"] as const,
  lists: () => [...scheduleTimeStudyKeys.all, "list"] as const,
  list: (filters?: { department?: string; studyYear?: string }) =>
    [...scheduleTimeStudyKeys.lists(), filters] as const,
  participants: () => [...scheduleTimeStudyKeys.all, "participants"] as const,
  scheduled: () => [...scheduleTimeStudyKeys.all, "scheduled"] as const,
}
