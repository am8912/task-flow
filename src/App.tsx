import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import TodayPage from "@/pages/TodayPage"
import AllTasksPage from "@/pages/AllTasksPage"
import CompletedPage from "@/pages/CompletedPage"
import CategoryPage from "@/pages/CategoryPage"
import CityPage from "@/pages/CityPage"

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TodayPage />} />
          <Route path="all" element={<AllTasksPage />} />
          <Route path="completed" element={<CompletedPage />} />
          <Route path="city" element={<CityPage />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
