/**
 * Custom Hooks for Dashboard
 * Extract complex logic from main Dashboard component
 */

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook for managing Found Items
 */
export function useFoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/found-items");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data barang",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/found-items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setItems(items.filter((item) => item.id !== id));
        toast({ title: "Success", description: "Barang berhasil dihapus" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus barang",
        variant: "destructive",
      });
    }
  };

  return {
    items,
    loading,
    fetchItems,
    deleteItem,
  };
}

/**
 * Hook for managing Lost Reports
 */
export function useLostReports() {
  const [lostReports, setLostReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLostReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/lost-reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLostReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8080/api/lost-reports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setLostReports(lostReports.filter((r) => r.id !== id));
      toast({ title: "Success", description: "Laporan berhasil dihapus" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus laporan", variant: "destructive" });
    }
  };

  const markReportDone = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8080/api/lost-reports/${id}/mark-done`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLostReports();
      toast({ title: "Success", description: "Laporan ditandai selesai" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengupdate status", variant: "destructive" });
    }
  };

  const markReportUndone = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8080/api/lost-reports/${id}/mark-undone`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLostReports();
      toast({ title: "Success", description: "Laporan ditandai aktif kembali" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengupdate status", variant: "destructive" });
    }
  };

  return {
    lostReports,
    loading,
    fetchLostReports,
    deleteReport,
    markReportDone,
    markReportUndone,
  };
}

/**
 * Hook for managing Matching
 */
export function useMatching() {
  const { toast } = useToast();

  const fetchReportMatches = async (reportId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/lost-reports/${reportId}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await response.json();
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengambil kecocokan", variant: "destructive" });
      return [];
    }
  };

  const recomputeMatches = async (reportId: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8080/api/lost-reports/${reportId}/recompute-matches`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Success", description: "Kecocokan berhasil diperhitungkan ulang" });
      return await fetchReportMatches(reportId);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memperhitungkan ulang kecocokan", variant: "destructive" });
      return [];
    }
  };

  const confirmMatch = async (matchId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/lost-reports/matches/${matchId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Confirm failed");
      toast({ title: "Success", description: "Kecocokan dikonfirmasi" });
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengkonfirmasi kecocokan", variant: "destructive" });
      return false;
    }
  };

  const rejectMatch = async (matchId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/lost-reports/matches/${matchId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Reject failed");
      toast({ title: "Success", description: "Kecocokan ditolak" });
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Gagal menolak kecocokan", variant: "destructive" });
      return false;
    }
  };

  return {
    fetchReportMatches,
    recomputeMatches,
    confirmMatch,
    rejectMatch,
  };
}
