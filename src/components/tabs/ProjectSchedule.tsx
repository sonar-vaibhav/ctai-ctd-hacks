import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Project, mockProcurementItems } from "@/data/mockData";
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  AlertTriangle,
  Zap,
  Users,
  FileText,
  BarChart3,
  Eye,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ProjectScheduleProps {
  project: Project;
}

export function ProjectSchedule({ project }: ProjectScheduleProps) {
  const [showGanttOverlay, setShowGanttOverlay] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['design']));

  const phases = [
    {
      id: 'design',
      name: 'Design Phase',
      description: 'Architectural planning and engineering design',
      icon: FileText,
      progress: 30,
      ...project.timeline.design,
    },
    {
      id: 'development',
      name: 'Development Phase', 
      description: 'Permits, approvals, and preparation',
      icon: Users,
      progress: 60,
      ...project.timeline.development,
    },
    {
      id: 'procurement',
      name: 'Procurement Phase',
      description: 'Material sourcing and vendor coordination',
      icon: Zap,
      progress: 15,
      ...project.timeline.procurement,
    },
    {
      id: 'installation',
      name: 'Installation Phase',
      description: 'Construction and final installation',
      icon: CheckCircle,
      progress: 0,
      ...project.timeline.installation,
    },
  ];

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  // Enhanced procurement data for Gantt overlay
  const procurementGanttData = useMemo(() => {
    return mockProcurementItems.map((item, index) => ({
      name: item.material,
      vendor: item.vendor,
      status: item.status,
      orderBy: item.orderBy,
      deliveryStart: item.deliveryStart,
      deliveryEnd: item.deliveryEnd,
      y: index * 30 + 20,
      height: 25,
      type: 'procurement'
    }));
  }, []);

  // Installation timeline data
  const installationGanttData = useMemo(() => {
    return [
      {
        name: 'Foundation Work',
        start: new Date('2025-12-01'),
        end: new Date('2025-12-15'),
        y: 0,
        height: 25,
        type: 'installation'
      },
      {
        name: 'Structural Assembly',
        start: new Date('2025-12-16'),
        end: new Date('2025-12-31'),
        y: 30,
        height: 25,
        type: 'installation'
      }
    ];
  }, []);

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
      {/* Enhanced Header with Controls */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Project Schedule</CardTitle>
              <CardDescription>
                Interactive roadmap with stepper view and Gantt overlay
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showGanttOverlay}
                  onCheckedChange={setShowGanttOverlay}
                />
                <span className="text-sm">Show Gantt Overlay</span>
              </div>
            </div>
          </div>
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

      {/* Stepper/Roadmap View */}
      <div className="space-y-6">
        {phases.map((phase, index) => {
          const progress = getPhaseProgress(phase);
          const duration = differenceInDays(phase.end, phase.start);
          const Icon = phase.icon;
          const isExpanded = expandedPhases.has(phase.id);
          const isLast = index === phases.length - 1;
          
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connection Line */}
              {!isLast && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-border z-0" />
              )}
              
              <Card className="dashboard-card relative z-10">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Phase Header with Expand/Collapse */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Phase Icon with Status */}
                        <div className="relative">
                          <div className={`p-3 rounded-lg ${getStatusColor(phase.status)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {phase.status === 'completed' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{phase.name}</h3>
                            <Badge className={getStatusColor(phase.status)}>
                              {getStatusIcon(phase.status)}
                              <span className="ml-1 capitalize">{phase.status.replace('-', ' ')}</span>
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{phase.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>{format(phase.start, 'MMM dd, yyyy')}</span>
                            <span>→</span>
                            <span>{format(phase.end, 'MMM dd, yyyy')}</span>
                            <span>•</span>
                            <span>{duration} days</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Progress</span>
                              <span className="text-muted-foreground">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePhaseExpansion(phase.id)}
                        className="flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-border"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Key Milestones
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2">
                              {phase.id === 'design' && (
                                <>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                                    Architectural plans completed
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                                    Engineering drawings approved
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-muted rounded-full"></div>
                                    Structural analysis finalized
                                  </li>
                                </>
                              )}
                              {phase.id === 'development' && (
                                <>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                                    Building permits obtained
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                                    Environmental approvals
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                                    Site preparation completed
                                  </li>
                                </>
                              )}
                              {phase.id === 'procurement' && (
                                <>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                                    Vendor contracts signed
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-muted rounded-full"></div>
                                    Material orders placed
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-muted rounded-full"></div>
                                    Delivery schedules confirmed
                                  </li>
                                </>
                              )}
                              {phase.id === 'installation' && (
                                <>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-muted rounded-full"></div>
                                    Foundation work completed
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-muted rounded-full"></div>
                                    Structural assembly finished
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-muted rounded-full"></div>
                                    Final inspections passed
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Dependencies
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2">
                              {index > 0 && (
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                  {phases[index - 1].name}
                                </li>
                              )}
                              {phase.id === 'procurement' && (
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                  Design approvals
                                </li>
                              )}
                              {phase.id === 'installation' && (
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                                  Material deliveries
                                </li>
                              )}
                              {index === phases.length - 1 && (
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                  All previous phases
                                </li>
                              )}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Team & Resources
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2">
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
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Gantt Overlay */}
      {showGanttOverlay && (
        <Card className="dashboard-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Interactive Gantt Chart Overlay
            </CardTitle>
            <CardDescription>Visual timeline showing procurement and installation schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Procurement Timeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Installation Timeline</span>
                </div>
              </div>

              {/* Gantt Chart */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px] space-y-2">
                  {/* Procurement Items */}
                  {procurementGanttData.map((item, index) => {
                    const getBarColor = (status: string) => {
                      switch (status) {
                        case 'critical': return '#ef4444';
                        case 'warning': return '#f59e0b';
                        case 'on-track': return '#10b981';
                        default: return '#6b7280';
                      }
                    };

                    return (
                      <motion.div
                        key={`proc-${item.name}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative h-8 flex items-center group"
                      >
                        <div className="w-48 pr-4 flex-shrink-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.vendor}</div>
                        </div>
                        <div className="flex-1 relative h-6 bg-muted rounded-lg overflow-hidden">
                          <div 
                            className="absolute top-0 h-full rounded-lg"
                            style={{ 
                              left: '10%',
                              width: '30%',
                              backgroundColor: '#fbbf24'
                            }}
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-popover border rounded-lg p-3 shadow-lg z-10 min-w-[200px]">
                              <div className="text-sm">
                                <div className="font-medium mb-1">{item.name}</div>
                                <div className="text-muted-foreground">
                                  <div>Vendor: {item.vendor}</div>
                                  <div>Order: {format(item.orderBy, 'MMM dd')}</div>
                                  <div>Delivery: {format(item.deliveryStart, 'MMM dd')} - {format(item.deliveryEnd, 'MMM dd')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-20 pl-4 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">Procurement</Badge>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Installation Items */}
                  {installationGanttData.map((item, index) => (
                    <motion.div
                      key={`inst-${item.name}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: (procurementGanttData.length + index) * 0.1 }}
                      className="relative h-8 flex items-center group"
                    >
                      <div className="w-48 pr-4 flex-shrink-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground truncate">Installation</div>
                      </div>
                      <div className="flex-1 relative h-6 bg-muted rounded-lg overflow-hidden">
                        <div 
                          className="absolute top-0 h-full rounded-lg"
                          style={{ 
                            left: '60%',
                            width: '25%',
                            backgroundColor: '#3b82f6'
                          }}
                        />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-popover border rounded-lg p-3 shadow-lg z-10 min-w-[200px]">
                            <div className="text-sm">
                              <div className="font-medium mb-1">{item.name}</div>
                              <div className="text-muted-foreground">
                                <div>Start: {format(item.start, 'MMM dd')}</div>
                                <div>End: {format(item.end, 'MMM dd')}</div>
                                <div>Duration: {differenceInDays(item.end, item.start)} days</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 pl-4 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">Installation</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts and Warnings */}
      <Card className="dashboard-card mt-6 border-warning/20 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Schedule Conflicts & Warnings
          </CardTitle>
          <CardDescription>Potential timeline conflicts requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20"
            >
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Steel Delivery vs Foundation Work</div>
                <div className="text-sm text-muted-foreground">
                  Steel delivery window overlaps with foundation work start date
                </div>
              </div>
              <Badge variant="outline" className="text-warning">Warning</Badge>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20"
            >
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">HVAC Installation Delay Risk</div>
                <div className="text-sm text-muted-foreground">
                  HVAC delivery scheduled close to installation start - consider buffer
                </div>
              </div>
              <Badge variant="outline" className="text-warning">Warning</Badge>
            </motion.div>
          </div>
        </CardContent>
      </Card>

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