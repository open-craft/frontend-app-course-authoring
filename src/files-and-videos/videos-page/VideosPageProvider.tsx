import React, { useMemo, ReactNode } from 'react';

interface VideosPageContextValue {
  courseId: string;
  path: string;
}

interface VideosPageProviderProps {
  courseId: string;
  children: ReactNode;
}

export const VideosPageContext = React.createContext<VideosPageContextValue | {}>({});

const VideosPageProvider = ({ courseId, children }: VideosPageProviderProps) => {
  const contextValue = useMemo(() => ({
    courseId,
    path: `/course/${courseId}/videos`,
  }), []);
  return (
    <VideosPageContext.Provider
      value={contextValue}
    >
      {children}
    </VideosPageContext.Provider>
  );
};
export default VideosPageProvider;
