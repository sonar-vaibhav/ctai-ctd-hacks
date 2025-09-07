import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project, mockProcurementItems } from "@/data/mockData";
import { format, differenceInDays } from "date-fns";
import { Calendar, Clock, AlertTriangle, CheckCircle, Package } from "lucide-react";

interface ProcurementTimelineProps {
  project: Project;
}

export function ProcurementTimeline({ project }: ProcurementTimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'status-danger';
      case 'warning':
        return 'status-warning';
      case 'on-track':
        return 'status-success';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'on-track':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const calculateTimeToOrder = (orderBy: Date) => {
    const today = new Date();
    const daysUntilOrder = differenceInDays(orderBy, today);
    return daysUntilOrder;
  };

  const sortedItems = [...mockProcurementItems].sort((a, b) => 
    a.orderBy.getTime() - b.orderBy.getTime()
  );

  return (
    <div className="tab-content">
      {/* Timeline Overview */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <CardTitle>Procurement Timeline Overview</CardTitle>
          <CardDescription>
            Critical path analysis and delivery schedule for project materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {mockProcurementItems.filter(item => item.status === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {mockProcurementItems.filter(item => item.status === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {mockProcurementItems.filter(item => item.status === 'on-track').length}
              </div>
              <div className="text-sm text-muted-foreground">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.min(...mockProcurementItems.map(item => calculateTimeToOrder(item.orderBy)))}
              </div>
              <div className="text-sm text-muted-foreground">Days to Next Order</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <CardTitle>Material Delivery Schedule</CardTitle>
          <CardDescription>Gantt-style timeline showing order and delivery windows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedItems.map((item, index) => {
              const orderDays = calculateTimeToOrder(item.orderBy);
              const deliveryDuration = differenceInDays(item.deliveryEnd, item.deliveryStart);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.material}</h4>
                        <p className="text-sm text-muted-foreground">{item.vendor}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  {/* Timeline Bar */}
                  <div className="ml-12 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Order by: {format(item.orderBy, 'MMM dd')}</span>
                      <span>Delivery: {format(item.deliveryStart, 'MMM dd')} - {format(item.deliveryEnd, 'MMM dd')}</span>
                    </div>
                    
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      {/* Order to delivery start */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-border"
                        style={{ 
                          width: `${Math.max(20, (orderDays + differenceInDays(item.deliveryStart, item.orderBy)) / 100 * 60)}%`
                        }}
                      />
                      
                      {/* Delivery window */}
                      <div 
                        className={`absolute top-0 h-full ${
                          item.status === 'critical' ? 'bg-destructive' :
                          item.status === 'warning' ? 'bg-warning' :
                          'bg-success'
                        }`}
                        style={{ 
                          left: `${Math.max(20, (orderDays + differenceInDays(item.deliveryStart, item.orderBy)) / 100 * 60)}%`,
                          width: `${Math.min(30, deliveryDuration / 100 * 20)}%`
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className={orderDays < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                        {orderDays < 0 ? `${Math.abs(orderDays)} days overdue` : 
                         orderDays === 0 ? 'Order today' :
                         `${orderDays} days to order`}
                      </span>
                      <span className="text-muted-foreground">
                        {deliveryDuration} day delivery window
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Timeline Table */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Detailed Schedule</CardTitle>
          <CardDescription>Complete procurement timeline with key dates and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Vendor</th>
                  <th>Order By</th>
                  <th>Delivery Window</th>
                  <th>Lead Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, index) => {
                  const leadTime = differenceInDays(item.deliveryStart, item.orderBy);
                  const orderDays = calculateTimeToOrder(item.orderBy);
                  
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="font-medium">{item.material}</td>
                      <td>{item.vendor}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {format(item.orderBy, 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td>
                        {format(item.deliveryStart, 'MMM dd')} - {format(item.deliveryEnd, 'MMM dd')}
                      </td>
                      <td>{leadTime} days</td>
                      <td>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {orderDays <= 7 && (
                            <Badge variant="outline" className="text-xs">
                              {orderDays <= 0 ? 'Urgent' : 'Soon'}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}