export const videosQueryKeys = {
  all: ['videos'] as const,
  course: (courseId: string) => [...videosQueryKeys.all, courseId] as const,
  page: (courseId: string) => [...videosQueryKeys.course(courseId), 'page'] as const,
  list: (courseId: string) => [...videosQueryKeys.course(courseId), 'list'] as const,
  settings: (courseId: string) => [...videosQueryKeys.course(courseId), 'settings'] as const,
  usage: (courseId: string, videoId: string) => [...videosQueryKeys.course(courseId), 'usage', videoId] as const,
};
