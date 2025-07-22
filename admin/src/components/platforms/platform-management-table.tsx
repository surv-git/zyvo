"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, FilterIcon, MoreHorizontal, ExternalLinkIcon, Eye, Edit, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableFooter } from "@/components/ui/table-footer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  getPlatformList, 
  activatePlatform, 
  deactivatePlatform, 
  deletePlatform 
} from "@/services/platform-service";
import type { Platform, PlatformListParams } from "@/types/platform";
import { getSiteConfigSync } from "@/config/site";

export function PlatformManagementTable() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getSiteConfigSync().admin.itemsPerPage);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Navigation handlers
  const handleViewPlatform = (id: string) => {
    router.push(`/platforms/${id}`);
  };

  const handleEditPlatform = (id: string) => {
    router.push(`/platforms/${id}/edit`);
  };

  // Fetch platforms
  const fetchPlatforms = useCallback(async () => {
    try {
      setLoading(true);
      const params: PlatformListParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { is_active: statusFilter === "active" })
      };
      
      const response = await getPlatformList(params);
      setPlatforms(response.data);
      setTotalItems(response.pagination.totalCount);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch platforms:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  // Handle platform status toggle
  const handleStatusToggle = async (platform: Platform) => {
    try {
      if (platform.is_active) {
        await deactivatePlatform(platform._id);
      } else {
        await activatePlatform(platform._id);
      }
      await fetchPlatforms();
    } catch (error) {
      console.error("Failed to update platform status:", error);
    }
  };

  // Handle platform deletion
  const handleDelete = async (platform: Platform) => {
    if (!confirm(`Are you sure you want to delete the platform "${platform.name}"?`)) {
      return;
    }
    
    try {
      await deletePlatform(platform._id);
      await fetchPlatforms();
    } catch (error) {
      console.error("Failed to delete platform:", error);
    }
  };

  // Handle search and filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchPlatforms();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, fetchPlatforms]);

  // Handle pagination
  useEffect(() => {
    fetchPlatforms();
  }, [currentPage, itemsPerPage, fetchPlatforms]);

  const getStatusBadge = (is_active: boolean) => {
    return (
      <Badge variant={is_active ? "default" : "secondary"} className="font-medium">
        {is_active ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle>Platforms</CardTitle>
          
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-[250px]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading platforms...</div>
          </div>
        ) : platforms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-muted-foreground">No platforms found</div>
            {(searchTerm || statusFilter !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>API Config</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((platform) => (
                    <TableRow key={platform._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{platform.name}</div>
                            {platform.base_url && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <ExternalLinkIcon className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{platform.base_url}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-0">
                          Platform
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(platform.is_active)}
                          <Switch
                            checked={platform.is_active}
                            onCheckedChange={() => handleStatusToggle(platform)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {platform.api_credentials_placeholder ? "Configured" : "Not Set"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(platform.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPlatform(platform._id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPlatform(platform._id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {platform.is_active ? (
                              <DropdownMenuItem onClick={() => handleStatusToggle(platform)}>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusToggle(platform)}>
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(platform)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[10, 20, 50, 100]}
              showItemsPerPageSelector={true}
              entityName="platforms"
              className="mt-4"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
