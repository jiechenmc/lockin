import {
  useState,
  useEffect,
  useRef,
  type SetStateAction,
  type Dispatch,
} from "react";

interface CheckInCardProto {
  name: string;
  setRefresh: Dispatch<SetStateAction<number>>;
}

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const CheckInCard = ({ name, setRefresh }: CheckInCardProto) => {
  const [totalSeconds, setTotalSeconds] = useState(-1);
  const [running, setRunning] = useState(false);
  const [acked, setAcked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  useEffect(() => {
    const fetchLastRecord = async () => {
      try {
        const res = await fetch(
          `/api/get?name=${encodeURIComponent(name)}&tz=${encodeURIComponent(tz)}`,
        );
        if (!res.ok) return;

        const record = await res.json();
        const createdAt = new Date(record.CreatedAt);
        const elapsed = Math.floor((Date.now() - createdAt.getTime()) / 1000);
        const remaining = 3600 - elapsed;

        if (record.Ack) {
          setAcked(true);
          setRunning(false);
          setTotalSeconds(0);
        } else if (remaining > 0) {
          setTotalSeconds(remaining);
          setRunning(true);
        } else if (record) {
          setTotalSeconds(0);
          setRunning(false);
        }
      } catch (err) {
        console.error("failed to fetch last record", err);
      }
    };

    fetchLastRecord();
  }, [name]);

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

  const handleClick = async () => {
    if (!running) {
      setTotalSeconds(3600);
      setRunning(true);
      try {
        const res = await fetch("/api/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, tz }),
        });
        if (!res.ok) console.error("failed to add record");
        setRefresh((i) => i + 1);
      } catch (err) {
        console.error("request failed", err);
      }
    } else if (!running && totalSeconds > 0) {
      setRunning(true);
    }
  };

  return (
    <>
      <div className="card bg-base-100 w-96 shadow-sm">
        <figure>
          <img
            src="https://t4.ftcdn.net/jpg/02/28/83/73/360_F_228837309_OmSaSR7Tk7farjC5q8qvz48004AGRRAf.jpg"
            alt="Shoes"
            className="w-full object-cover"
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title">{name}</h2>
          <div className="card-actions justify-end">
            {!acked ? (
              <>
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
              </>
            ) : (
              <p className="text-success">✅ Checked in today</p>
            )}
          </div>
        </div>
        {totalSeconds === 0 && !running && !acked && (
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await fetch(
                  `/api/ack?name=${encodeURIComponent(name)}&tz=${encodeURIComponent(tz)}`,
                  {
                    method: "PATCH",
                  },
                );
                setRefresh((r) => r + 1); // triggers useEffect to refetch
              } catch (err) {
                console.error("failed to ack", err);
              }
            }}
          >
            Ack
          </button>
        )}
      </div>
    </>
  );
};

export default CheckInCard;
