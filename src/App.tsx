import "./index.css";
import { WeatherDashboard } from "./WeatherDashboard";
import  ScheduledRadio from "./ScheduledRadio";

function App() {
  return (
    <div className="App">
      <div className="weatherDash">
        <WeatherDashboard />  
      </div>
      <div className="radioPlayer">
        <ScheduledRadio />
      </div>
    </div>
  );
}

export default App;
