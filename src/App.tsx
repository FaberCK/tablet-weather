import "./index.css";
import { WeatherDashboard } from "./WeatherDashboard";
import  ScheduledRadio from "./ScheduledRadio";

function App() {
  return (
    <div className="App">
      <div className="weatherDash">
      <WeatherDashboard />  
      <ScheduledRadio />
      </div>
    </div>
  );
}

export default App;
