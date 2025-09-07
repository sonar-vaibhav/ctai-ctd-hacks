import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Mail, Phone, Star, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Project, mockVendors } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

interface VendorsTabProps {
  project: Project;
  showPredictionResults?: boolean;
}

export function VendorsTab({ project, showPredictionResults = false }: VendorsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const { toast } = useToast();

  const handleContactVendor = (vendorName: string, vendorEmail: string) => {
    toast({
      title: "Contacting Vendor",
      description: `Opening contact form for ${vendorName} (${vendorEmail})`,
    });
  };

  const filteredVendors = mockVendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.materials.some(material => material.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMaterial = selectedMaterial === "all" || 
                           vendor.materials.some(material => material.toLowerCase().includes(selectedMaterial.toLowerCase()));
    
    return matchesSearch && matchesMaterial;
  });

  const materialTypes = Array.from(
    new Set(mockVendors.flatMap(vendor => vendor.materials))
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="tab-content">
      {/* AI Prediction Results Banner */}
      {showPredictionResults && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="dashboard-card border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary">
                <Star className="h-4 w-4" />
                <span className="font-medium">AI Prediction Results</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your project requirements, we've identified the best vendors for your materials.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search and Filter */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Find and connect with qualified suppliers for your project materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search vendors, materials, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedMaterial === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMaterial("all")}
              >
                All Materials
              </Button>
              {materialTypes.slice(0, 4).map((material) => (
                <Button
                  key={material}
                  variant={selectedMaterial === material ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMaterial(material)}
                  className="hidden sm:inline-flex"
                >
                  {material}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVendors.map((vendor, index) => (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="dashboard-card hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(vendor.rating)}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({vendor.rating}/5.0)
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="gradient-button"
                    onClick={() => handleContactVendor(vendor.name, vendor.email)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{vendor.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{vendor.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-primary hover:underline cursor-pointer">
                      {vendor.email}
                    </span>
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Specializes In:</h4>
                  <div className="flex flex-wrap gap-1">
                    {vendor.materials.map((material) => (
                      <span
                        key={material}
                        className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="pt-2 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm font-medium">Response</div>
                      <div className="text-xs text-muted-foreground">&lt; 24h</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Delivery</div>
                      <div className="text-xs text-muted-foreground">2-4 weeks</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Payment</div>
                      <div className="text-xs text-muted-foreground">Net 30</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredVendors.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No vendors found</h3>
            <p className="text-sm">Try adjusting your search criteria or material filters</p>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <Card className="dashboard-card mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Vendor Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{mockVendors.length}</div>
              <div className="text-sm text-muted-foreground">Total Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(mockVendors.reduce((sum, v) => sum + v.rating, 0) / mockVendors.length).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{materialTypes.length}</div>
              <div className="text-sm text-muted-foreground">Material Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {mockVendors.filter(v => v.rating >= 4.5).length}
              </div>
              <div className="text-sm text-muted-foreground">Top Rated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}