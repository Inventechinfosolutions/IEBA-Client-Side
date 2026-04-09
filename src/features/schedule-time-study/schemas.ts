import { z } from "zod"

import {
  SchedulePayPeriodGroupStatus,
} from "./enums/schedule-time-study.enum"
import type {
  ParticipantsListFormValues,
  ScheduleTimeStudyFormValues,
  ScheduleTimeStudyModalFormValues,
  TimeStudyPeriodsFormValues,
} from "./types"

export const scheduleTimeStudyFormSchema = z.object({
  department: z.string().min(1, "Department is required"),
  studyYear: z.string().min(1, "Time study year is required"),
  file: z
    .instanceof(File)
    .nullable()
    .refine((value) => value !== null, "Please choose a file"),
})

export const scheduleTimeStudyDefaultValues: ScheduleTimeStudyFormValues = {
  department: "",
  studyYear: "",
  file: null,
}

export const timeStudyPeriodsFormSchema = z.object({
  fiscalYear: z.string().min(1, "Fiscal year is required"),
  department: z.string().min(1, "Department is required"),
  timeStudyPeriod: z.string().trim(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  hours: z.string(),
  holidays: z.string(),
  allocable: z.string(),
  nonAllocable: z.string(),
})

export const timeStudyPeriodsDefaultValues: TimeStudyPeriodsFormValues = {
  fiscalYear: "",
  department: "",
  timeStudyPeriod: "",
  startDate: "",
  endDate: "",
  hours: "",
  holidays: "",
  allocable: "",
  nonAllocable: "",
}

export const participantsListFormSchema = z.object({
  groupName: z.string().trim().min(1, "Group name is required"),
  department: z.string().min(1, "Department is required"),
  studyYear: z.string().min(1, "Year is required"),
  selectedUserBy: z.enum(["job-pool", "user"]),
})

export const participantsListFormDefaultValues: ParticipantsListFormValues = {
  groupName: "",
  department: "",
  studyYear: "",
  selectedUserBy: "job-pool",
}

export const scheduleTimeStudyModalFormSchema = z.object({
  studyYear: z.string().min(1, "Year is required"),
  department: z.string().min(1, "Department is required"),
  entries: z.array(
    z.object({
      timeStudyPeriod: z.string(),
      groups: z.string(),
      status: z.enum([
        SchedulePayPeriodGroupStatus.DRAFT,
        SchedulePayPeriodGroupStatus.PUBLISHED,
        SchedulePayPeriodGroupStatus.INACTIVE,
      ]),
    })
  ),
})

export const scheduleTimeStudyModalDefaultValues: ScheduleTimeStudyModalFormValues = {
  studyYear: "",
  department: "",
  entries: [
    {
      timeStudyPeriod: "",
      groups: "",
      status: SchedulePayPeriodGroupStatus.DRAFT,
    },
  ],
}
