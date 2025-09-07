import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/data/mockData";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Zap,
  Users,
  FileText
} from "lucide-react";

interface ProjectScheduleProps {
  project: Project;
}

export function ProjectSchedule({ project }: ProjectScheduleProps) {
  const phases = [
    {
      id: 'design',
      name: 'Design Phase',
      description: 'Architectural planning and engineering design',
      icon: FileText,
      ...project.timeline.design,
    },
    {
      id: 'development',
      name: 'Development Phase', 
      description: 'Permits, approvals, and preparation',
      icon: Users,
      ...project.timeline.development,
    },
    {
      id: 'procurement',
      name: 'Procurement Phase',
      description: 'Material sourcing and vendor coordination',
      icon: Zap,
      ...project.timeline.procurement,
    },
    {
      id: 'installation',
      name: 'Installation Phase',
      description: 'Construction and final installation',
      icon: CheckCircle,
      ...project.timeline.installation,
    },
  ];

  const getPhaseProgress = (phase: any) => {
    const today = new Date();
    const totalDays = differenceInDays(phase.end, phase.start);
    
    if (phase.status === 'completed') return 100;
    if (phase.status === 'pending') return 0;
    
    if (isBefore(today, phase.start)) return 0;
    if (isAfter(today, phase.end)) return 100;
    
    const daysElapsed = differenceInDays(today, phase.start);
    return Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-success';
      case 'in-progress':
        return 'status-warning';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const overallProgress = phases.reduce((sum, phase) => sum + getPhaseProgress(phase), 0) / phases.length;

  return (
    <div className="tab-content">
      {/* Project Overview */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <CardTitle>Project Schedule Overview</CardTitle>
          <CardDescription>
            Track progress across all project phases with integrated procurement milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {phases.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed Phases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {phases.filter(p => p.status === 'in-progress').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Phases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {differenceInDays(
                    Math.max(...phases.map(p => p.end.getTime())),
                    Math.min(...phases.map(p => p.start.getTime()))
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {format(Math.max(...phases.map(p => p.end.getTime())), 'MMM yyyy')}
                </div>
                <div className="text-sm text-muted-foreground">Target Completion</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const progress = getPhaseProgress(phase);
          const duration = differenceInDays(phase.end, phase.start);
          const Icon = phase.icon;
          
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="dashboard-card">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Phase Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${getStatusColor(phase.status)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{phase.name}</h3>
                          <p className="text-muted-foreground text-sm">{phase.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{format(phase.start, 'MMM dd, yyyy')}</span>
                            <span>→</span>
                            <span>{format(phase.end, 'MMM dd, yyyy')}</span>
                            <span>•</span>
                            <span>{duration} days</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(phase.status)}>
                          {getStatusIcon(phase.status)}
                          <span className="ml-1 capitalize">{phase.status.replace('-', ' ')}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progress</span>
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Phase Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Key Milestones</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {phase.id === 'design' && (
                            <>
                              <li>• Architectural plans completed</li>
                              <li>• Engineering drawings approved</li>
                              <li>• Structural analysis finalized</li>
                            </>
                          )}
                          {phase.id === 'development' && (
                            <>
                              <li>• Building permits obtained</li>
                              <li>• Environmental approvals</li>
                              <li>• Site preparation completed</li>
                            </>
                          )}
                          {phase.id === 'procurement' && (
                            <>
                              <li>• Vendor contracts signed</li>
                              <li>• Material orders placed</li>
                              <li>• Delivery schedules confirmed</li>
                            </>
                          )}
                          {phase.id === 'installation' && (
                            <>
                              <li>• Foundation work completed</li>
                              <li>• Structural assembly finished</li>
                              <li>• Final inspections passed</li>
                            </>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Dependencies</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {index > 0 && <li>• {phases[index - 1].name}</li>}
                          {phase.id === 'procurement' && <li>• Design approvals</li>}
                          {phase.id === 'installation' && <li>• Material deliveries</li>}
                          {index === phases.length - 1 && <li>• All previous phases</li>}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Team & Resources</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {phase.id === 'design' && (
                            <>
                              <li>• Architects (3)</li>
                              <li>• Engineers (5)</li>
                              <li>• Design consultants (2)</li>
                            </>
                          )}
                          {phase.id === 'development' && (
                            <>
                              <li>• Project managers (2)</li>
                              <li>• Legal team (1)</li>
                              <li>• Site supervisors (3)</li>
                            </>
                          )}
                          {phase.id === 'procurement' && (
                            <>
                              <li>• Procurement specialists (2)</li>
                              <li>• Vendor managers (3)</li>
                              <li>• Quality inspectors (2)</li>
                            </>
                          )}
                          {phase.id === 'installation' && (
                            <>
                              <li>• Construction crew (15)</li>
                              <li>• Site managers (3)</li>
                              <li>• Safety officers (2)</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Risk Assessment */}
      <Card className="dashboard-card mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Schedule Risk Assessment
          </CardTitle>
          <CardDescription>Potential risks and mitigation strategies for project timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">High Priority Risks</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Material Delivery Delays</div>
                    <div className="text-sm text-muted-foreground">Steel delivery critical path item</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Weather Dependencies</div>
                    <div className="text-sm text-muted-foreground">Winter construction constraints</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Resource Availability</div>
                    <div className="text-sm text-muted-foreground">Skilled labor shortage</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Mitigation Strategies</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Alternative Suppliers</div>
                    <div className="text-sm text-muted-foreground">Backup vendors identified</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Schedule Buffer</div>
                    <div className="text-sm text-muted-foreground">10% time buffer built in</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Early Procurement</div>
                    <div className="text-sm text-muted-foreground">Critical materials ordered early</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}