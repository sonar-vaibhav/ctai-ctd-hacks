import { motion } from "framer-motion";
import { Calendar, DollarSign, MapPin, Building } from "lucide-react";
import { Project } from "@/data/mockData";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
}

export function ProjectCard({ project, isSelected, onClick }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-success';
      case 'planning':
        return 'status-warning';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm leading-tight">{project.name}</h3>
          <span className={`status-badge ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building className="h-3 w-3" />
            <span>{project.type}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>{project.region}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3" />
            <span>${(project.volume / 1000000).toFixed(1)}M</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Created {format(project.createdAt, 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}