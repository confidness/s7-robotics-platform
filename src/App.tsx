import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import Layout from './components/Layout'
import { useApp } from './lib/store'

import Login from './pages/Login'
import Assigned, { AssignedLesson } from './pages/student/Assigned'
import MentorLessons, { LessonSubmissions } from './pages/mentor/MentorLessons'
import LessonBuilder from './pages/mentor/LessonBuilder'
import NotFound from './pages/NotFound'

import Dashboard from './pages/student/Dashboard'
import Courses from './pages/student/Courses'
import CourseDetail from './pages/student/CourseDetail'
import LessonPage from './pages/student/Lesson'
import MyLearning from './pages/student/MyLearning'
import Projects from './pages/student/Projects'
import ProjectDetail from './pages/student/ProjectDetail'
import Achievements from './pages/student/Achievements'
import Gallery from './pages/student/Gallery'
import Competition from './pages/student/Competition'
import AIMentor from './pages/student/AIMentor'
import Profile from './pages/student/Profile'
import StudentSettings from './pages/student/Settings'

import MentorDashboard from './pages/mentor/Dashboard'
import MentorStudents from './pages/mentor/Students'
import MentorGroups from './pages/mentor/Groups'
import MentorReviews from './pages/mentor/Reviews'
import ReviewDetail from './pages/mentor/ReviewDetail'
import MentorProjects from './pages/mentor/Projects'
import MentorAnalytics from './pages/mentor/Analytics'
import { MentorCourses, MentorCompetition, MentorSettings } from './pages/mentor/Misc'

function Protected({ role, children }: { role: 'student' | 'mentor'; children: ReactNode }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== role) return <Navigate to={user.role === 'mentor' ? '/m' : '/'} replace />
  return <>{children}</>
}

export default function App() {
  const { user } = useApp()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'mentor' ? '/m' : '/'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'mentor' ? '/m' : '/'} replace /> : <Login register />} />

      <Route
        element={
          <Protected role="student">
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/learn/:courseId/:lessonId" element={<LessonPage />} />
        <Route path="/learning" element={<MyLearning />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/competition" element={<Competition />} />
        <Route path="/ai" element={<AIMentor />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/assigned" element={<Assigned />} />
        <Route path="/assigned/:lessonId" element={<AssignedLesson />} />
        <Route path="/settings" element={<StudentSettings />} />
      </Route>

      <Route
        path="/m"
        element={
          <Protected role="mentor">
            <Layout />
          </Protected>
        }
      >
        <Route index element={<MentorDashboard />} />
        <Route path="groups" element={<MentorGroups />} />
        <Route path="students" element={<MentorStudents />} />
        <Route path="students/:studentId" element={<MentorStudents />} />
        <Route path="reviews" element={<MentorReviews />} />
        <Route path="reviews/:projectId" element={<ReviewDetail />} />
        <Route path="projects" element={<MentorProjects />} />
        <Route path="courses" element={<MentorCourses />} />
        <Route path="competition" element={<MentorCompetition />} />
        <Route path="analytics" element={<MentorAnalytics />} />
        <Route path="lessons" element={<MentorLessons />} />
        <Route path="lessons/new" element={<LessonBuilder />} />
        <Route path="lessons/:lessonId" element={<LessonSubmissions />} />
        <Route path="lessons/:lessonId/edit" element={<LessonBuilder />} />
        <Route path="settings" element={<MentorSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
