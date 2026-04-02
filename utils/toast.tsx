import React from 'react';
import toast from 'react-hot-toast';

export const confirmToast = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-1.5 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
          >
            取消
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
          >
            确认
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  });
};
