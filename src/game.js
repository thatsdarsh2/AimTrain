const DEFAULT_DURATION_SECONDS = 30;

export function createSession({ 
    durationSeconds = DEFAULT_DURATION_SECONDS,
 } = {}) {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0){
        throw new RangeError("session duration must be a positive number.");
    }

    let timerId = null;
    let startedAt = 0;
    let disposed = false;

    let state = {
        phase: "ready",
        durationSeconds,
        remainingSeconds: durationSeconds,
        hits: 0,
        misses: 0,
    };

    const listeners = new Set();

    function getState() {
        return { ...state};

    }

    function publish() {
        for (const listener of listeners) {
            listener(getState());
        }
    }
    
    function subscribe(listener){
        if (typeof listener !== "function") {
            throw new TypeError("A session listener must be a function.");
        }

        if(disposed) {
            return() => {};
        
        }
        listeners.add(listener);
        listener(getState());

        return () => listeners.delete(listener);
    }

    function stopTimer() {
        if (timerId !== null){
            window.clearInterval(timerId);
            timerId = null;
        }
    }
    function finish() {
        if (disposed || state.phase !== "running" ) {
            return;
        }

        stopTimer();
        state.phase = "complete";
        state.remainingSeconds = 0;
        publish();
    }


    function updateTimer() {
        if (disposed || state.phase !== "running") {
            return;
        }

        const elapsedSeconds = (performance.now() - startedAt)/ 1000;
        state.remainingSeconds = Math.max(0, Math.ceil(durationSeconds - elapsedSeconds),);

        if(state.remainingSeconds === 0) {
            finish();
            return;
        }

        publish();
    }


    function start(){
        if(disposed || state.phase !== "ready") {
            return;
        }

        state.phase = "running";
        startedAt = performance.now();
        timerId = window.setInterval(updateTimer, 100);
        publish();
    }


    function recordHit() {
        if(disposed || state.phase !== "running") {
            return;
        }
        state.hits += 1;
        publish();
    }

    function recordMiss() {
        if(disposed || state.phase !== "running") {
            return;
        }

        state.misses += 1;
        publish();
    }



    function reset() {
        if (disposed) {
            return;
        }

        stopTimer();

        state = {
            phase: "ready",
            durationSeconds,
            remainingSeconds: durationSeconds,
            hits: 0,
            misses: 0,
        };

        publish();
    }



    function dispose() {
        if (disposed) {
            return;
        }

        stopTimer();
        disposed = true;
        listeners.clear();
    }


    return {
        getState,
        subscribe,
        start,
        recordHit,
        recordMiss,
        reset,
        dispose,
    };
}