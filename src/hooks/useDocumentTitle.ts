import { useEffect } from 'react';

const APP_NAME = 'PhotoServe';

export function useDocumentTitle(title?: string, suffix: boolean = true) {
  useEffect(() => {
    const previousTitle = document.title;
    
    if (title) {
      document.title = suffix ? `${title} | ${APP_NAME}` : title;
    } else {
      document.title = APP_NAME;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
}

export function setDocumentTitle(title?: string, suffix: boolean = true) {
  if (title) {
    document.title = suffix ? `${title} | ${APP_NAME}` : title;
  } else {
    document.title = APP_NAME;
  }
}
