import React from "react";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className="main-h-screen bg-gray-100">
      {/* Add navbar here later */}
      <main>
        {/*Outlet renders the current route's component*/}
        <Outlet />
      </main>
    </div>
  );
}

export default App;