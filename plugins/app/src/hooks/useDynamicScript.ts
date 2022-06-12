import { useEffect, useState } from 'react';

const loadedScripts: { [name: string]: Promise<void> } = {};

export const useDynamicScript = (
  name: string,
): {
  failed: boolean;
  ready: boolean;
} => {
  const url =
    process.env.NODE_ENV === 'production' ? `/plugins/${name}/remoteEntry.js` : 'http://localhost:3001/remoteEntry.js';

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!name) {
      return;
    }

    if (name in loadedScripts) {
      loadedScripts[name]
        .then(() => {
          setReady(true);
          setFailed(false);
        })
        .catch(() => {
          setReady(false);
          setFailed(true);
        });
      return;
    }

    const element = document.createElement('script');

    loadedScripts[name] = new Promise<void>((resolve, reject) => {
      element.src = url;
      element.type = 'text/javascript';
      element.async = true;

      setReady(false);
      setFailed(false);

      element.onload = (): void => {
        setReady(true);
        resolve();
      };

      element.onerror = (): void => {
        setReady(false);
        setFailed(true);
        reject();
      };

      document.head.appendChild(element);
    });

    // return () => {
    //   document.head.removeChild(element);
    // };
  }, [name, url]);

  return {
    failed,
    ready,
  };
};
