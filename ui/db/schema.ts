import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  bookTitle: text("book_title"),
  author: text("author"),
  imageSrc: text("image_src").notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  userProgress: many(userProgress),
  units: many(units),
}));

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), 
  description: text("description").notNull(), 
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
  content: text("content"),
  objectives: text("objectives").array(),
});

export const unitsRelations = relations(units, ({ many, one }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
  videoUrl: text("video_url"),
  description: text("description"),
  content: text("content"),
  objectives: text("objectives").array(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  lessonProgress: many(lessonProgress),
}));

export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/ai_mascot.png"),
  activeCourseId: integer("active_course_id").references(() => courses.id, { onDelete: "cascade" }),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  activeCourse: one(courses, {
    fields: [userProgress.activeCourseId],
    references: [courses.id],
  }),
}));

export const courseGenerationJobs = pgTable("course_generation_jobs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  bucket: text("bucket").notNull(),
  storagePath: text("storage_path").notNull(),
  detectedSubject: text("detected_subject"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  statusMessage: text("status_message"),
  errorMessage: text("error_message"),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
