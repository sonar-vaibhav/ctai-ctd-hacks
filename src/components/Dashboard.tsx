import { useState } from "react";
import { motion } from "framer-motion";
import { Project, mockProjects } from "@/data/mockData";
import { Sidebar } from "./Sidebar";
import { ProjectTabs } from "./ProjectTabs";
import { ThemeToggle } from "./ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, TrendingUp, Clock, AlertCircle, Loader2 } from "lucide-react";

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    mockProjects.length > 0 ? mockProjects[0] : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async (newProjectData: Omit<Project, 'id' | 'createdAt' | 'timeline'>) => {
    setIsLoading(true);
    
    // Simulate project creation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newProject: Project = {
      ...newProjectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      timeline: {
        design: { 
          start: new Date(), 
          end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          status: 'pending' 
        },
        development: { 
          start: new Date(Date.now() + 61 * 24 * 60 * 60 * 1000), 
          end: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          status: 'pending' 
        },
        procurement: { 
          start: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 
          end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          status: 'pending' 
        },
        installation: { 
          start: new Date(Date.now() + 181 * 24 * 60 * 60 * 1000), 
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'pending' 
        },
      },
    };

    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    setIsLoading(false);
  };

  const handleSelectProject = async (project: Project) => {
    setIsLoading(true);
    
    // Simulate project loading delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSelectedProject(project);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full z-50 lg:relative lg:z-auto">
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 min-h-screen pl-80 lg:pl-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <h1 className="text-xl font-semibold">ProcureAI Dashboard</h1>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold">AI Procurement Management Platform</h1>
              <p className="text-muted-foreground text-sm">
                Optimize your procurement with intelligent insights and automation
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading project...</p>
              </motion.div>
            </div>
          ) : selectedProject ? (
            <ProjectTabs project={selectedProject} />
          ) : (
            <EmptyState onCreateProject={handleCreateProject} />
          )}
        </main>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'timeline'>) => void;
}

function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
            <FolderOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to ProcureAI</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Transform your procurement process with AI-powered insights, predictive analytics, 
            and intelligent supplier management. Get started by creating your first project.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">AI Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get accurate material quantity and cost predictions based on project parameters
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Smart Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Optimize procurement schedules with intelligent timeline management and risk assessment
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="text-center">
              <AlertCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Identify potential supply chain risks and get proactive mitigation recommendations
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm text-muted-foreground"
        >
          <p>Ready to optimize your procurement process? Create your first project to get started.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}