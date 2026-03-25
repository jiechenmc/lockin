import { useState, useEffect, useRef } from "react";

interface CheckInCardProto {
  name: string;
}

const CheckInCard = ({ name }: CheckInCardProto) => {
  const [totalSeconds, setTotalSeconds] = useState(3600);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  const handleClick = () => {
    if (!running) {
      setTotalSeconds(3600); // reset
      setRunning(true);
    } else if (!running && totalSeconds > 0) setRunning(true);
  };

  return (
    <>
      <div className="card bg-base-100 w-96 shadow-sm">
        <figure>
          <img
            src="https://t4.ftcdn.net/jpg/02/28/83/73/360_F_228837309_OmSaSR7Tk7farjC5q8qvz48004AGRRAf.jpg"
            alt="Shoes"
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title">{name}</h2>
          <div className="card-actions justify-end">
            <button className="btn btn-primary" onClick={handleClick}>
              {running ? "Running..." : "Start"}
            </button>
            <div className="flex flex-col">
              <span className="countdown font-mono text-5xl">
                <span
                  style={{ "--value": minutes } as React.CSSProperties}
                  aria-live="polite"
                  aria-label={String(minutes)}
                />
              </span>
              minutes
            </div>
            <div className="flex flex-col">
              <span className="countdown font-mono text-5xl">
                <span
                  style={{ "--value": seconds } as React.CSSProperties}
                  aria-live="polite"
                  aria-label={String(seconds)}
                />
              </span>
              seconds
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckInCard;
