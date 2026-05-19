import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <Button asChild>
          <Link to="/">Kembali ke Halaman Utama</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
