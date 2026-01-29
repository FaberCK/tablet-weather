import "./index.css";
import { WeatherDashboard } from "./WeatherDashboard";
//import { Clock } from "./Clock";
import ScheduledRadio from './ScheduledRadio';
import { useState } from "react";

function App() {
  const [radioVisible, setRadioVisible] = useState(false);

  return (
    <div className="App">
      <div className="mainArea" >
        <WeatherDashboard />
      </div>
      <div className="sideArea">
        <div className="radioToggle">
          <button onClick={() => setRadioVisible((v) => !v)}>
            {radioVisible ? "Hide Radio" : "Show Radio"}
          </button>
        </div>
        <div style={{ display: radioVisible ? 'block' : 'none' }}>
          <ScheduledRadio />
        </div>
      </div>
    </div>
  );
}

export default App;
