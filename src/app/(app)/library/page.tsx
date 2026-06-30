"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Wand2,
  Tags,
  Trash2,
  FolderOpen,
  Image,
  Video,
  Camera,
  Layers,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AssetStatus = "idea" | "generated" | "produced" | "uploaded";

const statusConfig: Record<AssetStatus, { label: string; class: string }> = {
  idea: { label: "Ide", class: "bg-gray-100 text-gray-700 border-gray-200" },
  generated: { label: "Generated", class: "bg-blue-100 text-blue-700 border-blue-200" },
  produced: { label: "Diproduksi", class: "bg-orange-100 text-orange-700 border-orange-200" },
  uploaded: { label: "Uploaded", class: "bg-green-100 text-green-700 border-green-200" },
};

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  photo: Camera,
  vector: Layers,
  video: Video,
  image: Image,
};

const mockProjects = [
  { id: "1", name: "Summer 2026", description: "Koleksi tema musim panas", assetCount: 12 },
  { id: "2", name: "Ramadan Series", description: "Aset hari raya Islam", assetCount: 8 },
  { id: "3", name: "Back to School", description: "Tema pendidikan & sekolah", assetCount: 5 },
];

const mockAssets = [
  { id: "1", projectId: "1", title: "Tropical Beach Sunset", type: "photo", status: "uploaded" as AssetStatus, createdAt: "2026-06-15", hasPrompt: true, hasSeo: true },
  { id: "2", projectId: "1", title: "Summer Ocean Background", type: "vector", status: "produced" as AssetStatus, createdAt: "2026-06-18", hasPrompt: true, hasSeo: false },
  { id: "3", projectId: "2", title: "Ramadan Kareem Pattern", type: "vector", status: "generated" as AssetStatus, createdAt: "2026-06-20", hasPrompt: true, hasSeo: false },
  { id: "4", projectId: "2", title: "Eid Mubarak Background", type: "image", status: "idea" as AssetStatus, createdAt: "2026-06-22", hasPrompt: false, hasSeo: false },
  { id: "5", projectId: "3", title: "School Supplies Flat Lay", type: "photo", status: "generated" as AssetStatus, createdAt: "2026-06-25", hasPrompt: true, hasSeo: true },
  { id: "6", projectId: "1", title: "Beach Cinematic B-Roll", type: "video", status: "idea" as AssetStatus, createdAt: "2026-06-28", hasPrompt: false, hasSeo: false },
];

const statusOrder: AssetStatus[] = ["idea", "generated", "produced", "uploaded"];

export default function LibraryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const filteredAssets = mockAssets.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject === "all" || a.projectId === filterProject;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchType = filterType === "all" || a.type === filterType;
    return matchSearch && matchProject && matchStatus && matchType;
  });

  function handleStatusChange(assetId: string, newStatus: AssetStatus) {
    toast.success(`Status diupdate ke "${statusConfig[newStatus].label}"`);
  }

  function handleCreateProject() {
    if (!newProjectName) return;
    toast.success(`Project "${newProjectName}" dibuat!`);
    setIsNewProjectOpen(false);
    setNewProjectName("");
    setNewProjectDesc("");
  }

  const stats = {
    total: mockAssets.length,
    idea: mockAssets.filter((a) => a.status === "idea").length,
    generated: mockAssets.filter((a) => a.status === "generated").length,
    produced: mockAssets.filter((a) => a.status === "produced").length,
    uploaded: mockAssets.filter((a) => a.status === "uploaded").length,
  };

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Asset Library"
        description="Kelola project, aset, prompt, dan SEO dalam satu tempat"
        actions={
          <div className="flex gap-2">
            <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Project Baru
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Project Baru</DialogTitle>
                  <DialogDescription>
                    Kelompokkan aset berdasarkan tema atau kampanye.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Nama Project</Label>
                    <Input
                      placeholder="mis: Summer 2026, Ramadan Series..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deskripsi (opsional)</Label>
                    <Textarea
                      placeholder="Deskripsi singkat..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button className="w-full" onClick={handleCreateProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" onClick={() => toast.info("Form tambah aset akan muncul di sini")}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Aset
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Aset", value: stats.total, status: "all" },
            { label: "Ide", value: stats.idea, status: "idea" },
            { label: "Generated", value: stats.generated, status: "generated" },
            { label: "Diproduksi", value: stats.produced, status: "produced" },
            { label: "Uploaded", value: stats.uploaded, status: "uploaded" },
          ].map((s) => (
            <Card
              key={s.status}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setFilterStatus(s.status)}
            >
              <CardContent className="py-3 px-4">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Projects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setFilterProject(project.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">{project.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{project.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{project.assetCount} aset</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Assets Table */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari aset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filterProject}
              onValueChange={(v) => v && setFilterProject(v)}
              items={[{ value: "all", label: "Semua Project" }, ...mockProjects.map((p) => ({ value: p.id, label: p.name }))]}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Project</SelectItem>
                {mockProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(v) => v && setFilterStatus(v)}
              items={{ all: "Semua Status", idea: "Ide", generated: "Generated", produced: "Diproduksi", uploaded: "Uploaded" }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {statusOrder.map((s) => (
                  <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterType}
              onValueChange={(v) => v && setFilterType(v)}
              items={{ all: "Semua Tipe", photo: "Foto", vector: "Vector", video: "Video", image: "Image" }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const Icon = assetTypeIcons[asset.type] || Image;
                  const project = mockProjects.find((p) => p.id === asset.projectId);
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm">{asset.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{asset.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{project?.name}</TableCell>
                      <TableCell>
                        <Select
                          value={asset.status}
                          onValueChange={(v) => v && handleStatusChange(asset.id, v as AssetStatus)}
                          items={{ idea: "Ide", generated: "Generated", produced: "Diproduksi", uploaded: "Uploaded" }}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs border-0 p-0 shadow-none">
                            <Badge variant="outline" className={`text-xs border ${statusConfig[asset.status].class}`}>
                              {statusConfig[asset.status].label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOrder.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{statusConfig[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {asset.hasPrompt ? (
                          <Badge variant="secondary" className="text-xs">Ada</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs p-1"
                            onClick={() => router.push("/prompt")}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.hasSeo ? (
                          <Badge variant="secondary" className="text-xs">Ada</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs p-1"
                            onClick={() => router.push("/seo")}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{asset.createdAt}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-sm hover:bg-accent hover:text-accent-foreground" />}>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push("/prompt")}>
                              <Wand2 className="h-4 w-4 mr-2" />
                              Generate Prompt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/seo")}>
                              <Tags className="h-4 w-4 mr-2" />
                              Generate SEO
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => toast.success("Aset dihapus")}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredAssets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Tidak ada aset yang ditemukan.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
