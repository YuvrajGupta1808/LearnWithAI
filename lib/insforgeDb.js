import { insforge } from "@/configs/insforgeClient";

const mapCourseRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    category: row.category,
    level: row.level,
    includeVideo: row.include_video,
    courseOutput: row.course_output,
    createdBy: row.created_by,
    userName: row.user_name,
    userProfileImage: row.user_profile_image,
    courseBanner: row.course_banner,
    publish: row.publish,
  };
};

const mapChapterRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    chapterId: row.chapter_id,
    content: row.content,
    videoId: row.video_id,
  };
};

const ensureClient = () => {
  if (!insforge) {
    throw new Error(
      "InsForge is not configured. Add NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY in .env.local."
    );
  }
};

export async function listCoursesByUser(email) {
  ensureClient();
  const { data, error } = await insforge.database
    .from("course_list")
    .select("*")
    .eq("created_by", email)
    .order("id", { ascending: false });

  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return (data || []).map(mapCourseRow);
}

export async function listCoursesPage(pageIndex = 0, pageSize = 9) {
  ensureClient();
  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await insforge.database
    .from("course_list")
    .select("*")
    .range(from, to);
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return (data || []).map(mapCourseRow);
}

export async function getCourseByCourseId(courseId, createdBy) {
  ensureClient();
  let query = insforge.database
    .from("course_list")
    .select("*")
    .eq("course_id", courseId)
    .limit(1);

  if (createdBy) {
    query = query.eq("created_by", createdBy);
  }

  const { data, error } = await query;
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return mapCourseRow(data?.[0]);
}

export async function createCourse(course) {
  ensureClient();
  const payload = [
    {
      course_id: course.courseId,
      name: course.name,
      level: course.level,
      category: course.category,
      course_output: course.courseOutput,
      created_by: course.createdBy,
      user_name: course.userName || null,
      user_profile_image: course.userProfileImage || null,
      course_banner: course.courseBanner || "/placeholder.png",
      include_video: course.includeVideo || "Yes",
    },
  ];
  const { data, error } = await insforge.database.from("course_list").insert(payload);
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return mapCourseRow(data?.[0]);
}

export async function updateCourseById(id, patch) {
  ensureClient();
  const dbPatch = {};
  if (patch.courseOutput !== undefined) dbPatch.course_output = patch.courseOutput;
  if (patch.courseBanner !== undefined) dbPatch.course_banner = patch.courseBanner;
  if (patch.publish !== undefined) dbPatch.publish = patch.publish;
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.level !== undefined) dbPatch.level = patch.level;
  if (patch.category !== undefined) dbPatch.category = patch.category;

  const { data, error } = await insforge.database
    .from("course_list")
    .update(dbPatch)
    .eq("id", id);
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return mapCourseRow(data?.[0]);
}

export async function updateCourseByCourseId(courseId, patch) {
  ensureClient();
  const dbPatch = {};
  if (patch.publish !== undefined) dbPatch.publish = patch.publish;
  if (patch.courseOutput !== undefined) dbPatch.course_output = patch.courseOutput;

  const { data, error } = await insforge.database
    .from("course_list")
    .update(dbPatch)
    .eq("course_id", courseId);
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return mapCourseRow(data?.[0]);
}

export async function deleteCourseById(id) {
  ensureClient();
  const { data, error } = await insforge.database.from("course_list").delete().eq("id", id);
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return data;
}

export async function createChapter(chapter) {
  ensureClient();
  const payload = [
    {
      chapter_id: chapter.chapterId,
      course_id: chapter.courseId,
      content: chapter.content,
      video_id: chapter.videoId,
    },
  ];
  const { data, error } = await insforge.database.from("chapters").insert(payload);
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return mapChapterRow(data?.[0]);
}

export async function getChapterByCourseAndChapterId(courseId, chapterId) {
  ensureClient();
  const { data, error } = await insforge.database
    .from("chapters")
    .select("*")
    .eq("course_id", courseId)
    .eq("chapter_id", chapterId)
    .limit(1);
  if (error) {
    console.error("InsForge Database Error:", error);
    throw error;
  }
  return mapChapterRow(data?.[0]);
}
