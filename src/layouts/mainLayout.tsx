// layouts/MainLayout.tsx

import { Outlet } from "react-router-dom";
import Header from "../components/layout/header";


export default function MainLayout() {
  return (
    <>
      <Header />

      <div className="app-container main-layout-content">
        <Outlet />
      </div>
    </>
  );
}
