"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QrCode, Image as ImageIcon, FileCode, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeGeneratorProps {
  galleryUrl: string;
  galleryTitle: string;
  logoUrl?: string;
}

type QRFormat = "png" | "svg";

export function QRCodeGenerator({
  galleryUrl,
  galleryTitle,
  logoUrl,
}: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrSvg, setQrSvg] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [downloadStatus, setDownloadStatus] = useState<{
    format: QRFormat | null;
    success: boolean;
  }>({ format: null, success: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQRCode();
  }, [galleryUrl, logoUrl]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Generate PNG version
      const pngDataUrl = await QRCode.toDataURL(galleryUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: "#1e293b", // slate-800
          light: "#ffffff",
        },
        errorCorrectionLevel: "H", // High error correction for logo overlay
      });
      setQrDataUrl(pngDataUrl);

      // Generate SVG version
      const svgString = await QRCode.toString(galleryUrl, {
        type: "svg",
        width: 512,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      setQrSvg(svgString);

      // If logo is provided, overlay it on canvas
      if (logoUrl && canvasRef.current) {
        await overlayLogo(pngDataUrl, logoUrl);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const overlayLogo = async (qrDataUrl: string, logoUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 512;
    canvas.height = 512;

    // Load QR code image
    const qrImage = new Image();
    qrImage.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve, reject) => {
      qrImage.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0, 512, 512);

        // Load and draw logo
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        
        logo.onload = () => {
          // Calculate logo size (20% of QR code)
          const logoSize = 512 * 0.2;
          const logoX = (512 - logoSize) / 2;
          const logoY = (512 - logoSize) / 2;

          // Draw white background circle for logo
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(256, 256, logoSize / 2 + 10, 0, 2 * Math.PI);
          ctx.fill();

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

          // Update data URL with logo overlay
          setQrDataUrl(canvas.toDataURL("image/png"));
          resolve();
        };

        logo.onerror = () => {
          // If logo fails to load, just use QR code without logo
          resolve();
        };

        logo.src = logoUrl;
      };

      qrImage.onerror = reject;
      qrImage.src = qrDataUrl;
    });
  };

  const handleDownload = async (format: QRFormat) => {
    setDownloadStatus({ format, success: false });

    try {
      let blob: Blob;
      let filename: string;

      if (format === "png") {
        // Convert data URL to blob
        const response = await fetch(qrDataUrl);
        blob = await response.blob();
        filename = `qrcode-${galleryTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
      } else {
        // SVG format
        blob = new Blob([qrSvg], { type: "image/svg+xml" });
        filename = `qrcode-${galleryTitle.toLowerCase().replace(/\s+/g, "-")}.svg`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // Show success feedback
      setDownloadStatus({ format, success: true });
      setTimeout(() => {
        setDownloadStatus({ format: null, success: false });
      }, 2000);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      setDownloadStatus({ format: null, success: false });
    }
  };

  return (
    <div className="space-y-4">
      {/* QR Code Display */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Code QR de la galerie</h3>
            <p className="text-sm text-slate-600">
              Partagez facilement lors d'événements
            </p>
          </div>
        </div>

        {/* QR Code Preview */}
        <div className="bg-white rounded-xl p-6 flex items-center justify-center border-2 border-slate-200 mb-4">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-600 font-medium">
                Génération du code QR...
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={qrDataUrl}
                alt={`QR Code pour ${galleryTitle}`}
                className="w-64 h-64 rounded-lg"
              />
              {/* Hidden canvas for logo overlay */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        {/* Gallery URL */}
        <div className="bg-slate-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            URL de la galerie
          </p>
          <p className="text-sm text-slate-900 font-mono break-all">
            {galleryUrl}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Download PNG */}
          <Button
            onClick={() => handleDownload("png")}
            disabled={isGenerating || downloadStatus.format === "png"}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl h-12"
          >
            {downloadStatus.format === "png" && downloadStatus.success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Téléchargé !</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                <span>PNG</span>
              </>
            )}
          </Button>

          {/* Download SVG */}
          <Button
            onClick={() => handleDownload("svg")}
            disabled={isGenerating || downloadStatus.format === "svg"}
            variant="outline"
            className="flex items-center gap-2 border-2 border-slate-300 hover:bg-slate-100 font-bold rounded-xl h-12"
          >
            {downloadStatus.format === "svg" && downloadStatus.success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Téléchargé !</span>
              </>
            ) : (
              <>
                <FileCode className="w-5 h-5" />
                <span>SVG</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-4">
        <h4 className="font-bold text-indigo-900 text-sm mb-2">
          💡 Conseils d'utilisation
        </h4>
        <ul className="space-y-1 text-xs text-indigo-700">
          <li>• Imprimez le code QR sur vos cartes de visite</li>
          <li>• Affichez-le lors d'événements pour un accès rapide</li>
          <li>• PNG pour impression, SVG pour design vectoriel</li>
          <li>• Le code QR fonctionne même si le logo est masqué</li>
        </ul>
      </div>
    </div>
  );
}
