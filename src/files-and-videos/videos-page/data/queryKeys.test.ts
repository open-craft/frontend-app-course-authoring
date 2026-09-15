import { videosQueryKeys } from './queryKeys';

describe('videosQueryKeys', () => {
  it('scopes page, list, settings, and usage to a course', () => {
    expect(videosQueryKeys.page('course-a')).toEqual(['videos', 'course-a', 'page']);
    expect(videosQueryKeys.list('course-a')).toEqual(['videos', 'course-a', 'list']);
    expect(videosQueryKeys.settings('course-a')).toEqual(['videos', 'course-a', 'settings']);
    expect(videosQueryKeys.usage('course-a', 'video-a')).toEqual(['videos', 'course-a', 'usage', 'video-a']);
    expect(videosQueryKeys.list('course-a')).not.toEqual(videosQueryKeys.list('course-b'));
  });
});
