import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Wallet from './pages/Wallet';
import ConfigAccount from "./pages/ConfigAccount";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/config" element={<ConfigAccount />} />
      </Routes>
    </Router>
  );
}

export default App;
