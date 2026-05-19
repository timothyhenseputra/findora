import { useEffect, useState } from "react";
import { Image as ImageIcon, Minus, Plus, RotateCcw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FoundItem = {
  id: number;
  name: string;
  brand?: string;
  color?: string;
  category: string;
  locationFound: string;
  foundDate: string;
  description?: string;
  photoUrl?: string;
  status: string;
  createdAt: string;
};

type Props = {
  item: FoundItem;
};

const ItemDetail = ({ item }: Props) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [zoom, setZoom] = useState(1.1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.2) * 10) / 10));
  const handleZoomOut = () => setZoom((z) => Math.max(1, Math.round((z - 0.2) * 10) / 10));
  const handleReset = () => {
    setZoom(1.1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (imageOpen) {
      setZoom(1.1);
      setPan({ x: 0, y: 0 });
      setDragging(false);
    }
  }, [imageOpen]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setPan({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        {item.photoUrl ? (
          <button type="button" onClick={() => setImageOpen(true)} className="relative group">
            <img src={item.photoUrl} alt={item.name} className="w-32 h-32 object-cover rounded border shadow-sm" />
            <span className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-semibold rounded">
              <Search className="w-4 h-4 mr-1" /> Perbesar
            </span>
          </button>
        ) : (
          <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded border">
            <ImageIcon className="text-gray-400" size={40} />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{item.name}</h2>
          <Badge className="mt-2">{item.status}</Badge>
          <div className="text-gray-500 mt-2">{item.category}</div>
          <div className="text-gray-500">{item.locationFound}</div>
          <div className="text-gray-400 text-xs">{new Date(item.foundDate).toLocaleDateString()}</div>
        </div>
      </div>
      <div>
        <div className="font-semibold mb-1">Deskripsi:</div>
        <div className="text-gray-700">{item.description || "-"}</div>
      </div>

      {item.photoUrl && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950">
              <DialogHeader className="px-6 py-4">
                <DialogTitle className="text-white">Zoom Foto Barang</DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6">
                <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_60%)] p-4">
                  <div className="relative h-[60vh] overflow-hidden rounded-xl bg-black/60 flex items-center justify-center">
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                    >
                      <img src={item.photoUrl} alt={item.name} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} className="max-h-full max-w-full transition-transform duration-150 select-none" draggable={false} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-white">
                    <div className="text-sm">Zoom: {(zoom * 100).toFixed(0)}%</div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-36 accent-indigo-400" />
                      <span className="text-xs text-white/70">Geser untuk zoom</span>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={handleZoomOut} className="bg-white/10 text-white hover:bg-white/20">
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={handleZoomIn} className="bg-white/10 text-white hover:bg-white/20">
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={handleReset} className="bg-white/10 text-white hover:bg-white/20">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ItemDetail;
