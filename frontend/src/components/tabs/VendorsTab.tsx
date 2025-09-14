import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Mail, Phone, Star, MessageCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Project, mockMaterials } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useVendors } from "@/hooks/useVendors";
import { Vendor } from "@/services/api";

interface VendorsTabProps {
  project: Project;
  showPredictionResults?: boolean;
}

export function VendorsTab({ project, showPredictionResults = false }: VendorsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [seeVendorsFor, setSeeVendorsFor] = useState<string | null>(null);
  const [contactVendor, setContactVendor] = useState<Vendor | null>(null);
  const [finalizedByMaterial, setFinalizedByMaterial] = useState<Record<string, Vendor | null>>({});
  const [managementData, setManagementData] = useState<Record<string, {
    paymentStatus: "Pending" | "Partially Paid" | "Completed";
    deliveryDate: Date | null;
    deliveryStatus: "Not Started" | "In Progress" | "Delivered";
    agreementStatus: "Finalized" | "Pending Confirmation";
    totalAmount: number;
    paymentMade: number;
    paymentDueDate: Date | null;
    notes: string;
    logs: { date: Date; quantity: number; note?: string }[];
  }>>({});
  const [manageMaterial, setManageMaterial] = useState<string | null>(null);
  const { toast } = useToast();

  // Use the new vendor hook
  const { vendors, loading, error, searchVendors, finalizeVendor, updateVendor } = useVendors();

  const materials = useMemo(() => mockMaterials, []);
  const materialTypes = useMemo(() => Array.from(new Set(materials.map(m => m.name))), [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m =>
      (selectedMaterial === "all" || m.name.toLowerCase().includes(selectedMaterial.toLowerCase())) &&
      (searchTerm.trim().length === 0 || m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [materials, searchTerm, selectedMaterial]);

  // Load finalized vendors on component mount
  useEffect(() => {
    const loadFinalizedVendors = async () => {
      try {
        // This would load finalized vendors from the API
        // For now, we'll use localStorage as fallback
        const finalizedVendors = JSON.parse(localStorage.getItem('finalizedVendors') || '{}');
        setFinalizedByMaterial(finalizedVendors);
      } catch (error) {
        console.error('Error loading finalized vendors:', error);
      }
    };
    
    loadFinalizedVendors();
  }, []);

  const renderStars = (rating: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
  ));

  const openFinalize = async (material: string, vendor: Vendor) => {
    try {
      // Finalize vendor via API
      await finalizeVendor(vendor.id);
      
      setFinalizedByMaterial(prev => ({ ...prev, [material]: vendor }));
      const materialData = mockMaterials.find(m => m.name === material);
      const unitPrice = Math.floor(materialData?.cost / (materialData?.quantity || 1));
      setManagementData(prev => ({
        ...prev,
        [material]: prev[material] ?? { 
          paymentStatus: "Pending", 
          deliveryDate: null, 
          deliveryStatus: "Not Started",
          agreementStatus: "Finalized",
          totalAmount: materialData?.cost || 0,
          paymentMade: 0,
          paymentDueDate: null,
          notes: "", 
          logs: [] 
        },
      }));
      
      // Store finalized vendor data for ProcurementTimeline integration
      const finalizedVendors = JSON.parse(localStorage.getItem('finalizedVendors') || '{}');
      finalizedVendors[material] = {
        vendor: vendor.vendor,
        deliveryDate: null, // Will be set when user updates delivery date in management
        notes: "",
        finalizedAt: new Date().toISOString()
      };
      localStorage.setItem('finalizedVendors', JSON.stringify(finalizedVendors));
    } catch (error) {
      console.error('Error finalizing vendor:', error);
    }
  };

  const addDeliveryLog = (material: string, quantity: number, date: Date, note?: string) => {
    setManagementData(prev => ({
      ...prev,
      [material]: {
        ...(prev[material] ?? { 
          paymentStatus: "Pending", 
          deliveryDate: null, 
          deliveryStatus: "Not Started",
          agreementStatus: "Finalized",
          totalAmount: 0,
          paymentMade: 0,
          paymentDueDate: null,
          notes: "", 
          logs: [] 
        }),
        logs: [ ...(prev[material]?.logs ?? []), { quantity, date, note } ],
      },
    }));
  };

  const handleSearchVendors = async (material: string) => {
    await searchVendors({ 
      material, 
      location: locationFilter || undefined 
    });
    setSeeVendorsFor(material);
  };

  const markPaymentAsPaid = (material: string) => {
    setManagementData(prev => ({
      ...prev,
      [material]: {
        ...(prev[material] ?? { 
          paymentStatus: "Pending", 
          deliveryDate: null, 
          deliveryStatus: "Not Started",
          agreementStatus: "Finalized",
          totalAmount: 0,
          paymentMade: 0,
          paymentDueDate: null,
          notes: "", 
          logs: [] 
        }),
        paymentStatus: "Completed",
        paymentMade: prev[material]?.totalAmount || 0,
      },
    }));
    toast({ title: "Payment marked as completed", description: `Full payment recorded for ${material}` });
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
          <CardTitle>Vendor Management</CardTitle>
          <CardDescription>Track materials, compare vendors, and finalize selections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Filter by location (optional)..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
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

      {/* Materials Table */}
      <Card className="dashboard-card mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material / Equipment</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((m, idx) => {
                const finalizedVendor = finalizedByMaterial[m.name] || null;
                return (
                  <motion.tr key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }} className={finalizedVendor ? "bg-emerald-50 dark:bg-emerald-900/20" : undefined}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {finalizedVendor && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {m.name}
                    </TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell>
                      {finalizedVendor ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Selected
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not selected</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSearchVendors(m.name)}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        {loading ? 'Searching...' : 'Find Vendors'}
                      </Button>
                      {finalizedVendor && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setContactVendor(finalizedVendor)}>
                            <MessageCircle className="h-4 w-4 mr-1" /> Contact Vendor
                          </Button>
                          <Button size="sm" className="ml-2" onClick={() => setManageMaterial(m.name)}>Manage</Button>
                        </>
                      )}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vendor selection modal per material */}
      <Dialog open={!!seeVendorsFor} onOpenChange={(open) => !open && setSeeVendorsFor(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendors for {seeVendorsFor}</DialogTitle>
            <DialogDescription>
              {loading ? 'Searching for vendors...' : `Found ${vendors.length} vendors`}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Searching IndiaMART for vendors...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="dashboard-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{vendor.vendor}</CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {vendor.finalized ? 'Finalized' : 'Available'}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setContactVendor(vendor)}>
                        <MessageCircle className="h-4 w-4 mr-1" /> Contact
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> {vendor.location}
                    </div>
                    {vendor.contact && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" /> {vendor.contact}
                      </div>
                    )}
                    {vendor.email && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" /> {vendor.email}
                      </div>
                    )}
                    {vendor.url && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <a 
                          href={vendor.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View on IndiaMART
                        </a>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={vendor.finalized}
                        onClick={() => openFinalize(seeVendorsFor!, vendor)}
                      >
                        {vendor.finalized ? "Finalized" : "Finalize"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {vendors.length === 0 && !loading && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No vendors found for {seeVendorsFor}. Try adjusting your search criteria.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Vendor Modal */}
      <Dialog open={!!contactVendor} onOpenChange={(open) => !open && setContactVendor(null)}>
        <DialogContent className="max-w-md">
          {contactVendor && (
            <>
              <DialogHeader>
                <DialogTitle>Contact {contactVendor.name}</DialogTitle>
                <DialogDescription>Send a message or view contact details</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {contactVendor.location}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {contactVendor.contact}</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {contactVendor.email}</div>
              </div>
              <div className="pt-2">
                <Button className="w-full" onClick={() => { toast({ title: "Contacted", description: `Email sent to ${contactVendor.email}` }); setContactVendor(null); }}>Send Email</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* Manage modal for a selected material */}
      <Dialog open={!!manageMaterial} onOpenChange={(open) => !open && setManageMaterial(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {manageMaterial && (() => {
            const vendor = finalizedByMaterial[manageMaterial!];
            if (!vendor) return null;
            const m = mockMaterials.find(mm => mm.name === manageMaterial);
            const mgmt = managementData[manageMaterial] ?? { 
              paymentStatus: "Pending", 
              deliveryDate: null, 
              deliveryStatus: "Not Started",
              agreementStatus: "Finalized",
              totalAmount: m?.cost || 0,
              paymentMade: 0,
              paymentDueDate: null,
              notes: "", 
              logs: [] 
            };
            const unitPrice = m ? Math.floor(m.cost / m.quantity) : 0;
            const paymentDue = mgmt.totalAmount - mgmt.paymentMade;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Manage {manageMaterial}
                  </DialogTitle>
                  <DialogDescription>Vendor: {vendor.name}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Vendor Name</Label>
                        <div className="text-base font-medium">{vendor.name}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Material / Equipment</Label>
                        <div className="text-base font-medium">{manageMaterial}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Quantity + Unit</Label>
                        <div className="text-base font-medium">{m?.quantity} {m?.unit}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Unit Price</Label>
                        <div className="text-base font-medium">₹{unitPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Cost</Label>
                        <div className="text-base font-medium">₹{mgmt.totalAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contact Info</Label>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {vendor.contact}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Procurement Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Procurement Status</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Agreement Status</Label>
                        <Select value={mgmt.agreementStatus} onValueChange={(val) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate: null, deliveryStatus: "Not Started", totalAmount: 0, paymentMade: 0, paymentDueDate: null, notes: "", logs: [] }), agreementStatus: val as any } }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Finalized">Finalized</SelectItem>
                            <SelectItem value="Pending Confirmation">Pending Confirmation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                        <div>
                          <Label>Delivery Date</Label>
                          <Input
                            type="date"
                            value={mgmt.deliveryDate ? mgmt.deliveryDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const newDate = e.target.value ? new Date(e.target.value) : null;
                              setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount: 0, paymentMade: 0, paymentDueDate: null, notes: "", logs: [] }), deliveryDate: newDate } }));
                              
                              // Update localStorage for ProcurementTimeline integration
                              const finalizedVendors = JSON.parse(localStorage.getItem('finalizedVendors') || '{}');
                              if (finalizedVendors[manageMaterial]) {
                                finalizedVendors[manageMaterial].deliveryDate = newDate?.toISOString() || null;
                                localStorage.setItem('finalizedVendors', JSON.stringify(finalizedVendors));
                              }
                            }}
                          />
                        </div>
                      <div>
                        <Label>Delivery Status</Label>
                        <Select value={mgmt.deliveryStatus} onValueChange={(val) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate: null, agreementStatus: "Finalized", totalAmount: 0, paymentMade: 0, paymentDueDate: null, notes: "", logs: [] }), deliveryStatus: val as any } }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Tracking */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                          <div className="text-lg font-semibold">₹{mgmt.totalAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Payment Made</Label>
                          <div className="text-lg font-semibold text-emerald-600">₹{mgmt.paymentMade.toLocaleString()}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Payment Due</Label>
                          <div className="text-lg font-semibold text-orange-600">₹{paymentDue.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Payment Status</Label>
                          <Select value={mgmt.paymentStatus} onValueChange={(val) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { deliveryDate: null, deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount: 0, paymentMade: 0, paymentDueDate: null, notes: "", logs: [] }), paymentStatus: val as any } }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Payment Due Date</Label>
                          <Input
                            type="date"
                            value={mgmt.paymentDueDate ? mgmt.paymentDueDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate: null, deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount: 0, paymentMade: 0, notes: "", logs: [] }), paymentDueDate: e.target.value ? new Date(e.target.value) : null } }))}
                          />
                        </div>
                        <Button 
                          onClick={() => markPaymentAsPaid(manageMaterial)}
                          disabled={mgmt.paymentStatus === "Completed"}
                          className="w-full"
                        >
                          Mark Payment as Paid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        placeholder="Add remarks (e.g., 'Advance paid', 'Delay expected')"
                        value={mgmt.notes}
                        onChange={(e) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate: null, deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount: 0, paymentMade: 0, paymentDueDate: null, logs: [] }), notes: e.target.value } }))}
                      />
                    </CardContent>
                  </Card>

                  {/* Delivery Logs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Delivery Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mgmt.logs.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No delivery logs yet</div>}
                        {mgmt.logs.map((log, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between border rounded-md p-3 bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium">{log.date.toDateString()}</div>
                              <div className="text-sm">- {log.quantity} {m?.unit}</div>
                              {log.note && <div className="text-xs text-muted-foreground">({log.note})</div>}
                            </div>
                          </motion.div>
                        ))}
                        <div className="flex gap-2 items-center pt-2">
                          <Input 
                            type="number" 
                            placeholder="Quantity delivered" 
                            className="w-32" 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && manageMaterial) {
                                const qty = Number((e.target as HTMLInputElement).value);
                                if (!isNaN(qty) && qty > 0) {
                                  addDeliveryLog(manageMaterial, qty, new Date());
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }} 
                          />
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              if (!manageMaterial) return;
                              const input = (e.currentTarget.previousSibling as HTMLInputElement);
                              const qty = Number(input.value);
                              if (!isNaN(qty) && qty > 0) {
                                addDeliveryLog(manageMaterial, qty, new Date());
                                input.value = "";
                              }
                            }}
                          >
                            Add Log
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this vendor?")) {
                              setFinalizedByMaterial(prev => {
                                const newState = { ...prev };
                                delete newState[manageMaterial];
                                return newState;
                              });
                              setManageMaterial(null);
                              toast({ title: "Vendor removed", description: `${vendor.name} removed from ${manageMaterial}` });
                            }
                          }}
                        >
                          Remove / Replace Vendor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setManageMaterial(null)}>Close</Button>
                  <Button onClick={() => { toast({ title: "Saved", description: `Management details saved for ${manageMaterial}` }); setManageMaterial(null); }}>Save Changes</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}