import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, mockApiCall } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

interface InputFormProps {
  project: Project;
  onPredictionComplete?: () => void;
}

export function InputForm({ project, onPredictionComplete }: InputFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectType: project.type,
    size: project.size,
    state: project.state,
    city: project.city,
    volume: project.volume.toString(),
  });
  const { toast } = useToast();

  const projectTypes = [
    'Commercial Construction',
    'Industrial Infrastructure',
    'Residential Development',
    'Healthcare Facility',
    'Educational Institution',
    'Transportation Hub',
    'Mixed-Use Development',
  ];

  const projectSizes = [
    'Small (<₹1Cr)',
    'Medium (₹1Cr–₹10Cr)',
    'Large (>₹10Cr)',
  ];

  const indianStates = [
    'Maharashtra',
    'Karnataka',
    'Tamil Nadu',
    'Gujarat',
    'Delhi',
    'Uttar Pradesh',
    'Telangana',
    'West Bengal',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await mockApiCall('/predict', formData);

      if (result.success) {
        toast({
          title: "Prediction Complete",
          description: `Analysis generated for ${formData.projectType}. Check the Material Prediction tab for results.`,
        });

        // Trigger prediction completion callback
        if (onPredictionComplete) {
          onPredictionComplete();
        }
      } else {
        throw new Error('Prediction failed');
      }
    } catch (error) {
      toast({
        title: "Prediction Failed",
        description: "Unable to generate material predictions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="tab-content">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Project Configuration</CardTitle>
          <CardDescription>
            Configure your project parameters to generate AI-powered material predictions and procurement insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) => handleInputChange('projectType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Project Size</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => handleInputChange('size', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project size" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume">Project Volume (₹)</Label>
                <Input
                  id="volume"
                  type="number"
                  placeholder="Enter project volume"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto gradient-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Predictions...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Run AI Prediction
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        </CardContent>
      </Card>

    </div>
  );
}