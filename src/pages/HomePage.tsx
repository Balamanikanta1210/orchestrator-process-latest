import { useMemo, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Processes } from '@uipath/uipath-typescript/processes';
import type { ProcessGetResponse, ProcessGetAllOptions } from '@uipath/uipath-typescript/processes';
import { PackageType, TargetFramework, RobotSize } from '@uipath/uipath-typescript/processes';
import type { PaginatedResponse, NonPaginatedResponse } from '@uipath/uipath-typescript/core';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Check, Minus, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
interface FolderOption {
  id: number;
  name: string;
}
type SortColumn = 'name' | 'version' | 'lastModifiedTime';
type SortDirection = 'asc' | 'desc';
function formatPackageType(type: PackageType): string {
  const labels: Record<PackageType, string> = {
    [PackageType.Undefined]: 'Undefined',
    [PackageType.Process]: 'Process',
    [PackageType.ProcessOrchestration]: 'Orchestration',
    [PackageType.WebApp]: 'Web App',
    [PackageType.Agent]: 'Agent',
    [PackageType.TestAutomationProcess]: 'Test Automation',
    [PackageType.Api]: 'API',
    [PackageType.MCPServer]: 'MCP Server',
    [PackageType.BusinessRules]: 'Business Rules',
  };
  return labels[type] || 'Unknown';
}
function formatTargetFramework(framework: TargetFramework): string {
  const labels: Record<TargetFramework, string> = {
    [TargetFramework.Legacy]: 'Legacy',
    [TargetFramework.Windows]: 'Windows',
    [TargetFramework.Portable]: 'Portable',
  };
  return labels[framework] || 'Unknown';
}
function formatRobotSize(size: RobotSize): string {
  const labels: Record<RobotSize, string> = {
    [RobotSize.Small]: 'Small',
    [RobotSize.Standard]: 'Standard',
    [RobotSize.Medium]: 'Medium',
    [RobotSize.Large]: 'Large',
  };
  return labels[size] || 'Standard';
}
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}
function getPackageTypeBadgeColor(type: PackageType): string {
  switch (type) {
    case PackageType.Process:
      return 'bg-blue-100 text-blue-700';
    case PackageType.ProcessOrchestration:
      return 'bg-purple-100 text-purple-700';
    case PackageType.Agent:
      return 'bg-green-100 text-green-700';
    case PackageType.WebApp:
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
export function HomePage() {
  const { sdk, isAuthenticated, isInitializing, login } = useAuth();
  const processes = useMemo(() => (sdk ? new Processes(sdk) : null), [sdk]);
  const [processList, setProcessList] = useState<ProcessGetResponse[]>([]);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  // Fetch processes from SDK
  useEffect(() => {
    if (!processes || !isAuthenticated) return;
    const fetchProcesses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const options: ProcessGetAllOptions = selectedFolderId
          ? { folderId: selectedFolderId, pageSize: itemsPerPage }
          : { pageSize: itemsPerPage };
        const result = await processes.getAll(options);
        // Handle both paginated and non-paginated responses
        let items: ProcessGetResponse[];
        if ('items' in result) {
          items = result.items;
        } else if (Array.isArray(result)) {
          items = result;
        } else {
          items = [];
        }
        setProcessList(items);
        // Extract unique folders only on initial unscoped fetch
        if (!selectedFolderId && items.length > 0) {
          const folderMap = new Map<number, FolderOption>();
          for (const p of items) {
            if (p.folderId && p.folderName) {
              folderMap.set(p.folderId, { id: p.folderId, name: p.folderName });
            }
          }
          const uniqueFolders = Array.from(folderMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setFolders(uniqueFolders);
        }
      } catch (err) {
        console.error('Failed to fetch processes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load processes');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProcesses();
  }, [processes, isAuthenticated, selectedFolderId]);
  // Client-side filtering and sorting
  const filteredProcesses = useMemo(() => {
    let filtered = [...processList];
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortColumn) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'version':
          aVal = a.packageVersion || '';
          bVal = b.packageVersion || '';
          break;
        case 'lastModifiedTime':
          aVal = new Date(a.lastModifiedTime || 0).getTime();
          bVal = new Date(b.lastModifiedTime || 0).getTime();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [processList, searchQuery, sortColumn, sortDirection]);
  // Client-side pagination
  const paginatedProcesses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProcesses.slice(startIndex, endIndex);
  }, [filteredProcesses, currentPage]);
  const totalPages = Math.max(1, Math.ceil(filteredProcesses.length / itemsPerPage));
  // Event handlers
  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
      setCurrentPage(1);
    },
    [sortColumn]
  );
  const handleFolderChange = useCallback((value: string) => {
    if (value === 'all') {
      setSelectedFolderId(null);
    } else {
      setSelectedFolderId(Number(value));
    }
    setCurrentPage(1);
  }, []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);
  // Loading state
  if (isInitializing) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Initializing...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  // Authentication required state
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-semibold text-gray-900">Authentication Required</h1>
            <p className="text-sm text-gray-600">
              Please sign in to view Orchestrator processes.
            </p>
            <Button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
              Sign In
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  // Main dashboard UI
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Orchestrator Processes</h1>
            <p className="text-sm text-gray-600">
              View and manage all processes across your organization
            </p>
          </div>
          {/* Error alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error loading processes</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
          {/* Search and filter controls */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search processes by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={selectedFolderId?.toString() || 'all'} onValueChange={handleFolderChange}>
              <SelectTrigger className="w-64 border-gray-300">
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id.toString()}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Process table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Process Name
                        {sortColumn === 'name' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package Key
                    </th>
                    <th
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('version')}
                    >
                      <div className="flex items-center gap-1">
                        Version
                        {sortColumn === 'version' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Folder
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Framework
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Robot Size
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto Update
                    </th>
                    <th
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('lastModifiedTime')}
                    >
                      <div className="flex items-center gap-1">
                        Last Modified
                        {sortColumn === 'lastModifiedTime' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2" colSpan={9}>
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedProcesses.length === 0 ? (
                    // Empty state
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center">
                        <p className="text-sm text-gray-500">
                          {searchQuery
                            ? 'No processes match your search'
                            : 'No processes found'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    // Process rows
                    paginatedProcesses.map((process) => (
                      <tr key={process.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{process.name}</span>
                            {process.isLatestVersion && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                Latest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs font-mono text-gray-500">{process.packageKey}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {process.packageVersion}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm text-gray-600">{process.folderName || '—'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              getPackageTypeBadgeColor(process.packageType)
                            }`}
                          >
                            {formatPackageType(process.packageType)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-gray-500">
                            {formatTargetFramework(process.targetFramework)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-gray-500">
                            {formatRobotSize(process.robotSize)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {process.autoUpdate ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-gray-500">
                            {process.lastModifiedTime ? formatDate(process.lastModifiedTime) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination controls */}
          {!isLoading && filteredProcesses.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredProcesses.length)} of{' '}
                {filteredProcesses.length} processes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}