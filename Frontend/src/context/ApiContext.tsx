import React, { createContext, useContext, useState } from 'react'
import type { Project, APIEndpoint, SDK, Integration } from '../types'
import { mockProjects, mockAPIEndpoints, mockSDKs, mockIntegrations } from '../data/mockAPIData'

interface APIContextType {
  projects: Project[]
  apiEndpoints: APIEndpoint[]
  sdks: SDK[]
  integrations: Integration[]
  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
}

const APIContext = createContext<APIContextType | undefined>(undefined)

export const useAPI = () => {
  const context = useContext(APIContext)
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider')
  }
  return context
}

export const APIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(mockProjects[0])
  const [apiEndpoints] = useState<APIEndpoint[]>(mockAPIEndpoints)
  const [sdks] = useState<SDK[]>(mockSDKs)
  const [integrations] = useState<Integration[]>(mockIntegrations)

  const createProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setProjects(prev => [...prev, newProject])
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    ))
  }

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id))
    if (selectedProject?.id === id) {
      setSelectedProject(null)
    }
  }

  return (
    <APIContext.Provider value={{
      projects,
      apiEndpoints,
      sdks,
      integrations,
      selectedProject,
      setSelectedProject,
      createProject,
      updateProject,
      deleteProject
    }}>
      {children}
    </APIContext.Provider>
  )
}