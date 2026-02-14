// A simple FIFO queue to process asynchronous tasks in parallel batches with a delay.
// This is used to throttle API calls to services like Gemini to avoid rate-limiting errors.

type TaskWrapper = {
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    retries: number;
};

const queue: TaskWrapper[] = [];
let isProcessing = false;

export const BATCH_SIZE = 1; // Reduceret til 1 for at være mere konservativ overfor quota
export const DELAY_BETWEEN_BATCHES = 2000; // Øget forsinkelse
const MAX_RETRIES = 3;

const processQueue = async () => {
    if (isProcessing || queue.length === 0) {
        return;
    }
    isProcessing = true;

    while (queue.length > 0) {
        const wrapper = queue.shift();
        if (!wrapper) continue;

        try {
            const result = await wrapper.task();
            wrapper.resolve(result);
        } catch (error: any) {
            const isRateLimit = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
            
            if (isRateLimit && wrapper.retries < MAX_RETRIES) {
                wrapper.retries++;
                const backoffDelay = Math.pow(2, wrapper.retries) * 1000;
                console.warn(`Rate limit hit. Retrying task in ${backoffDelay}ms... (Attempt ${wrapper.retries}/${MAX_RETRIES})`);
                
                // Sæt den tilbage i køen efter en pause
                setTimeout(() => {
                    queue.push(wrapper);
                    if (!isProcessing) processQueue();
                }, backoffDelay);
            } else {
                wrapper.reject(error);
            }
        }

        if (queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    isProcessing = false;
};

/**
 * Adds an asynchronous task to the queue.
 * @param task A function that returns a Promise (e.g., an API call).
 * @returns A Promise that resolves or rejects when the task is eventually executed.
 */
export const addApiTask = <T>(task: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject, retries: 0 });
        if (!isProcessing) {
            processQueue();
        }
    });
};