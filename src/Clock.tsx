import  { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dateString = now.toLocaleDateString();

  const isNight = now.getHours() < 6 || now.getHours() >= 18;
  const titleStyle = {
    color: isNight ? "red" : "inherit",
  };

  return (
    <div className="clock screen" style={titleStyle}>
      <div className="clock-time" >{timeString}</div>
      <div className="clock-date" >{dateString}</div>
    </div>
  );
}