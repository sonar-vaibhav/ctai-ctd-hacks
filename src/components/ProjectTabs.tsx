import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/data/mockData";
import { InputForm } from "./tabs/InputForm";
import { MaterialPrediction } from "./tabs/MaterialPrediction";
import { VendorsTab } from "./tabs/VendorsTab";
import { ProcurementTimeline } from "./tabs/ProcurementTimeline";
import { ProjectSchedule } from "./tabs/ProjectSchedule";
import { ChatbotPanel } from "./tabs/ChatbotPanel";

interface ProjectTabsProps {
  project: Project;
}

export function ProjectTabs({ project }: ProjectTabsProps) {
  const [predictionCompleted, setPredictionCompleted] = useState(false);
  const tabs = [
    { id: "input", label: "Input Form", component: InputForm },
    { id: "prediction", label: "Material Prediction", component: MaterialPrediction },
    { id: "vendors", label: "Vendors", component: VendorsTab },
    { id: "timeline", label: "Procurement Timeline", component: ProcurementTimeline },
    { id: "schedule", label: "Project Schedule", component: ProjectSchedule },
    { id: "chatbot", label: "AI Assistant", component: ChatbotPanel },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground text-sm">
              {project.type} • {project.region} • ${(project.volume / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium status-badge ${
            project.status === 'active' ? 'status-success' :
            project.status === 'planning' ? 'status-warning' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {project.status}
          </div>
        </div>
      </div>

      <Tabs defaultValue="input" className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4 grid w-fit grid-cols-6 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-xs px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="input" className="mt-0 h-full overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <InputForm 
                project={project} 
                onPredictionComplete={() => setPredictionCompleted(true)} 
              />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="prediction" className="mt-0 h-full overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MaterialPrediction 
                project={project} 
                showPredictionResults={predictionCompleted} 
              />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="vendors" className="mt-0 h-full overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <VendorsTab 
                project={project} 
                showPredictionResults={predictionCompleted} 
              />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-0 h-full overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ProcurementTimeline project={project} />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="schedule" className="mt-0 h-full overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ProjectSchedule project={project} />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="chatbot" className="mt-0 h-full overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ChatbotPanel project={project} />
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}